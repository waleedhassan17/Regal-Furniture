/**
 * Applies new files in supabase/migrations/ to the database in DATABASE_URL using
 * `supabase db push`, which records applied versions in supabase_migrations.schema_migrations.
 * The connection string is never printed.
 */
import { spawn } from "node:child_process"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is not set. Add the Session pooler connection string to .env.local.")
  process.exit(1)
}

const redact = (text: string) => text.replaceAll(url, "[DATABASE_URL]").replace(/postgres(ql)?:\/\/[^\s"']+/g, "[connection string]")
const dryRun = process.argv.includes("--dry-run")
const args = ["supabase", "db", "push", "--db-url", url, "--yes", ...(dryRun ? ["--dry-run"] : [])]

const child = spawn("npx", args, { stdio: ["ignore", "pipe", "pipe"], env: process.env })
child.stdout.on("data", (chunk: Buffer) => process.stdout.write(redact(chunk.toString())))
child.stderr.on("data", (chunk: Buffer) => process.stderr.write(redact(chunk.toString())))
child.on("close", (code) => process.exit(code ?? 1))
