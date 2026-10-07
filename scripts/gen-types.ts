/**
 * Generates src/types/database.ts from the live `public` schema, in the shape
 * supabase-js expects (Tables / Views / Functions / Enums with Relationships).
 * Usage: npm run db:types
 */
import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { connectDatabase } from "./lib/db"

const OUTPUT = resolve(process.cwd(), "src/types/database.ts")

/**
 * Postgres cannot say whether a view column is nullable, so supabase marks them all
 * `| null`. List the view columns that are guaranteed non-null here.
 */
const VIEW_NON_NULL: Record<string, string[]> = {
  order_overview: [
    "id", "order_number", "client_id", "client_name", "client_phone_digits", "order_date",
    "delivery_deadline", "status", "is_archived", "is_seed", "created_at", "updated_at",
    "item_count", "ready_count", "total_quantity", "item_preview", "days_left", "attention_rank",
  ],
  order_balances: ["order_id", "client_id", "status", "is_archived", "delivery_charges", "received"],
}

/** Columns whose generated type should be narrower than the SQL type. */
const COLUMN_OVERRIDES: Record<string, Record<string, string>> = {}

type ColumnRow = {
  table_name: string
  column_name: string
  udt_name: string
  data_type: string
  is_nullable: "YES" | "NO"
  column_default: string | null
  is_identity: "YES" | "NO"
  identity_generation: string | null
  is_generated: string
  relkind: string
  ordinal_position: number
}

type FkRow = {
  constraint_name: string
  table_name: string
  columns: string[]
  referenced_table: string
  referenced_columns: string[]
  is_one_to_one: boolean
}

type FnRow = {
  name: string
  arg_names: string[] | null
  arg_types: string[]
  arg_modes: string[] | null
  return_type: string
  returns_set: boolean
  has_defaults: number
}

const SCALAR: Record<string, string> = {
  uuid: "string", text: "string", varchar: "string", bpchar: "string", citext: "string",
  date: "string", timestamptz: "string", timestamp: "string", time: "string", timetz: "string",
  interval: "string", bytea: "string", inet: "string",
  int2: "number", int4: "number", int8: "number", float4: "number", float8: "number", numeric: "number",
  bool: "boolean", json: "Json", jsonb: "Json", void: "undefined", record: "Record<string, unknown>",
}

async function main() {
  const db = await connectDatabase()
  try {
    const enums = await db.query<{ name: string; labels: string[] }>(`
      select t.typname::text as name, array_agg(e.enumlabel::text order by e.enumsortorder) as labels
      from pg_type t
      join pg_enum e on e.enumtypid = t.oid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
      group by t.typname order by t.typname`)
    const enumNames = new Set(enums.rows.map((e) => e.name))

    const columns = await db.query<ColumnRow>(`
      select c.table_name, c.column_name, c.udt_name, c.data_type, c.is_nullable, c.column_default,
             c.is_identity, c.identity_generation, c.is_generated, cl.relkind, c.ordinal_position
      from information_schema.columns c
      join pg_class cl on cl.relname = c.table_name
      join pg_namespace n on n.oid = cl.relnamespace and n.nspname = c.table_schema
      where c.table_schema = 'public' and cl.relkind in ('r', 'v', 'm')
      order by c.table_name, c.ordinal_position`)

    const fks = await db.query<FkRow>(`
      select con.conname::text as constraint_name,
             src.relname::text as table_name,
             array(select a.attname from unnest(con.conkey) with ordinality k(attnum, ord)
                   join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum order by k.ord)::text[] as columns,
             ref.relname::text as referenced_table,
             array(select a.attname from unnest(con.confkey) with ordinality k(attnum, ord)
                   join pg_attribute a on a.attrelid = con.confrelid and a.attnum = k.attnum order by k.ord)::text[] as referenced_columns,
             exists (select 1 from pg_constraint u where u.conrelid = con.conrelid and u.contype in ('p', 'u')
                     and u.conkey::int[] @> con.conkey::int[] and u.conkey::int[] <@ con.conkey::int[]) as is_one_to_one
      from pg_constraint con
      join pg_class src on src.oid = con.conrelid
      join pg_namespace sn on sn.oid = src.relnamespace
      join pg_class ref on ref.oid = con.confrelid
      join pg_namespace rn on rn.oid = ref.relnamespace
      where con.contype = 'f' and sn.nspname = 'public' and rn.nspname = 'public'
      order by src.relname, con.conname`)

    const fns = await db.query<FnRow>(`
      select p.proname as name, p.proargnames::text[] as arg_names,
             array(select format_type(t, null) from unnest(coalesce(p.proallargtypes, p.proargtypes::oid[])) t) as arg_types,
             p.proargmodes::text[] as arg_modes,
             format_type(p.prorettype, null) as return_type,
             p.proretset as returns_set,
             p.pronargdefaults as has_defaults
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prokind = 'f'
        and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      order by p.proname`)

    const byTable = new Map<string, ColumnRow[]>()
    for (const col of columns.rows) {
      byTable.set(col.table_name, [...(byTable.get(col.table_name) ?? []), col])
    }

    const tsType = (udt: string): string => {
      if (udt.startsWith("_")) return `${tsType(udt.slice(1))}[]`
      if (enumNames.has(udt)) return `Database["public"]["Enums"]["${udt}"]`
      return SCALAR[udt] ?? "unknown"
    }
    const fmtType = (pgType: string): string => {
      const name = pgType.replace(/^public\./, "").replace(/"/g, "")
      if (name.endsWith("[]")) return `${fmtType(name.slice(0, -2))}[]`
      const aliases: Record<string, string> = {
        "timestamp with time zone": "timestamptz", "timestamp without time zone": "timestamp",
        "character varying": "varchar", integer: "int4", bigint: "int8", smallint: "int2",
        boolean: "bool", "double precision": "float8", real: "float4",
      }
      return tsType(aliases[name] ?? name)
    }

    const relationships = (table: string) => {
      const rels = fks.rows.filter((fk) => fk.table_name === table)
      if (rels.length === 0) return "[]"
      return `[\n${rels
        .map(
          (fk) => `          {
            foreignKeyName: "${fk.constraint_name}"
            columns: [${fk.columns.map((c) => `"${c}"`).join(", ")}]
            isOneToOne: ${fk.is_one_to_one}
            referencedRelation: "${fk.referenced_table}"
            referencedColumns: [${fk.referenced_columns.map((c) => `"${c}"`).join(", ")}]
          },`
        )
        .join("\n")}\n        ]`
    }

    const columnType = (table: string, col: ColumnRow, nullable: boolean) => {
      const base = COLUMN_OVERRIDES[table]?.[col.column_name] ?? tsType(col.udt_name)
      return nullable ? `${base} | null` : base
    }

    const tableBlocks: string[] = []
    const viewBlocks: string[] = []
    for (const [table, cols] of [...byTable.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const isView = cols[0].relkind !== "r"
      if (isView) {
        const nonNull = new Set(VIEW_NON_NULL[table] ?? [])
        const row = cols
          .map((c) => `          ${c.column_name}: ${columnType(table, c, !nonNull.has(c.column_name))}`)
          .join("\n")
        viewBlocks.push(`      ${table}: {\n        Row: {\n${row}\n        }\n        Relationships: []\n      }`)
        continue
      }
      const row = cols.map((c) => `          ${c.column_name}: ${columnType(table, c, c.is_nullable === "YES")}`).join("\n")
      const insert = cols
        .map((c) => {
          const generatedAlways = c.identity_generation === "ALWAYS" || c.is_generated === "ALWAYS"
          if (generatedAlways) return `          ${c.column_name}?: never`
          const optional = c.is_nullable === "YES" || c.column_default !== null || c.is_identity === "YES"
          return `          ${c.column_name}${optional ? "?" : ""}: ${columnType(table, c, c.is_nullable === "YES")}`
        })
        .join("\n")
      const update = cols
        .map((c) => {
          const generatedAlways = c.identity_generation === "ALWAYS" || c.is_generated === "ALWAYS"
          if (generatedAlways) return `          ${c.column_name}?: never`
          return `          ${c.column_name}?: ${columnType(table, c, c.is_nullable === "YES")}`
        })
        .join("\n")
      tableBlocks.push(
        `      ${table}: {\n        Row: {\n${row}\n        }\n        Insert: {\n${insert}\n        }\n        Update: {\n${update}\n        }\n        Relationships: ${relationships(table)}\n      }`
      )
    }

    const fnBlocks = fns.rows.map((fn) => {
      const modes = fn.arg_modes ?? fn.arg_types.map(() => "i")
      const names = fn.arg_names ?? []
      const inArgs = fn.arg_types
        .map((type, i) => ({ type, name: names[i], mode: modes[i] }))
        .filter((a) => a.mode === "i" || a.mode === "b")
      const outCols = fn.arg_types
        .map((type, i) => ({ type, name: names[i], mode: modes[i] }))
        .filter((a) => a.mode === "t" || a.mode === "o")
      const args =
        inArgs.length === 0
          ? "never"
          : `{ ${inArgs
              .map((a, i) => `${a.name}${i >= inArgs.length - fn.has_defaults ? "?" : ""}: ${fmtType(a.type)}`)
              .join("; ")} }`
      let returns = outCols.length
        ? `{ ${outCols.map((c) => `${c.name}: ${fmtType(c.type)} | null`).join("; ")} }`
        : fmtType(fn.return_type)
      if (!outCols.length && !["void", "boolean", "uuid"].includes(fn.return_type)) returns = `${returns} | null`
      if (fn.returns_set) returns = `${returns}[]`
      return `      ${fn.name}: {\n        Args: ${args}\n        Returns: ${returns}\n      }`
    })

    const enumBlocks = enums.rows.map((e) => `      ${e.name}: ${e.labels.map((l) => `"${l}"`).join(" | ")}`)
    const enumConsts = enums.rows.map(
      (e) => `      ${e.name}: [${e.labels.map((l) => `"${l}"`).join(", ")}],`
    )

    const output = `// Generated by scripts/gen-types.ts from the live database schema. Do not edit by hand.
// Regenerate with: npm run db:types

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
${tableBlocks.join("\n")}
    }
    Views: {
${viewBlocks.join("\n")}
    }
    Functions: {
${fnBlocks.join("\n")}
    }
    Enums: {
${enumBlocks.join("\n")}
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
export type Views<T extends keyof PublicSchema["Views"]> = PublicSchema["Views"][T]["Row"]
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]

export const Constants = {
  public: {
    Enums: {
${enumConsts.join("\n")}
    },
  },
} as const
`
    writeFileSync(OUTPUT, output)
    console.log(
      `Wrote src/types/database.ts — ${tableBlocks.length} tables, ${viewBlocks.length} views, ${fnBlocks.length} functions, ${enumBlocks.length} enums.`
    )
  } finally {
    await db.end()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
