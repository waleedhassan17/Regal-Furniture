import { z } from "zod"
import { isoDate, moneyInput, optionalText, requiredText, uuid } from "@/lib/validation/fields"
import { PRODUCTION_STATUSES, ATTENTION_LEVELS } from "@/lib/domain/status"

/** Free-text material fields, shown under "More details" except size, sheet code and note. */
export const ITEM_DETAIL_FIELDS = [
  { key: "metal_colour", label: "Metal colour", placeholder: "e.g. Black matt" },
  { key: "pc", label: "PC", placeholder: "" },
  { key: "rack", label: "Rack", placeholder: "" },
  { key: "fabric", label: "Fabric", placeholder: "" },
  { key: "leather", label: "Leather", placeholder: "" },
  { key: "foam", label: "Foam", placeholder: "" },
  { key: "railing", label: "Railing", placeholder: "" },
  { key: "lock", label: "Lock", placeholder: "" },
] as const

export type ItemDetailKey = (typeof ITEM_DETAIL_FIELDS)[number]["key"]

const quantity = z
  .string()
  .trim()
  .refine((v) => /^\d{1,6}$/.test(v) && Number(v) >= 1 && Number(v) <= 100000, "Enter a quantity of 1 or more.")
  .transform(Number)

export const orderItemSchema = z.object({
  id: uuid(),
  name: requiredText(200, "Enter the item name."),
  quantity,
  size: optionalText(200, "Size"),
  sheet_code: optionalText(200, "Sheet code"),
  metal_colour: optionalText(200, "Metal colour"),
  pc: optionalText(200, "PC"),
  rack: optionalText(200, "Rack"),
  fabric: optionalText(200, "Fabric"),
  leather: optionalText(200, "Leather"),
  foam: optionalText(200, "Foam"),
  railing: optionalText(200, "Railing"),
  lock: optionalText(200, "Lock"),
  note: optionalText(2000, "Note"),
  image_path: z.string().max(300).nullable(),
})

export const orderFormSchema = z
  .object({
    id: uuid(),
    client_id: z.uuid({ message: "Choose a client, or add a new one." }),
    bill_number: optionalText(60, "Bill number"),
    delivery_address: optionalText(500, "Delivery address"),
    order_date: isoDate("Choose the order date."),
    delivery_deadline: isoDate("Choose the delivery deadline."),
    responsible_id: z
      .string()
      .transform((v) => (v === "" ? null : v))
      .pipe(z.uuid({ message: "Choose someone from the list." }).nullable()),
    special_instructions: optionalText(4000, "Special instructions"),
    items: z.array(orderItemSchema).min(1, "Add at least one item.").max(300, "An order can have up to 300 items."),
    finance: z
      .object({
        order_amount: moneyInput,
        delivery_charges: moneyInput,
      })
      .optional(),
  })
  .refine((v) => v.delivery_deadline >= v.order_date, {
    path: ["delivery_deadline"],
    message: "The deadline can't be before the order date.",
  })
  .superRefine((v, ctx) => {
    v.items.forEach((item, index) => {
      if (item.image_path && !item.image_path.startsWith(`orders/${v.id}/${item.id}/`)) {
        ctx.addIssue({ code: "custom", path: ["items", index, "image_path"], message: "This photo belongs to a different item." })
      }
    })
  })

export type OrderFormValues = z.input<typeof orderFormSchema>
export type OrderValues = z.output<typeof orderFormSchema>
export type OrderItemFormValues = z.input<typeof orderItemSchema>

export function emptyItem(id: string): OrderItemFormValues {
  return {
    id,
    name: "",
    quantity: "1",
    size: "",
    sheet_code: "",
    metal_colour: "",
    pc: "",
    rack: "",
    fabric: "",
    leather: "",
    foam: "",
    railing: "",
    lock: "",
    note: "",
    image_path: null,
  }
}

// ---------------------------------------------------------------------------
// Orders list filters (kept in the URL)
// ---------------------------------------------------------------------------
export const ORDER_SORTS = {
  deadline: "Nearest deadline",
  urgency: "Most urgent first",
  newest: "Newest first",
  deadline_desc: "Latest deadline",
} as const
export type OrderSort = keyof typeof ORDER_SORTS

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values).optional().catch(undefined)

export const orderFiltersSchema = z.object({
  q: z.string().max(100).optional().catch(undefined),
  /** Absent = open orders only; "all" = every status. */
  status: optionalEnum([...PRODUCTION_STATUSES, "all"] as const),
  attention: optionalEnum(ATTENTION_LEVELS),
  responsible: z.union([z.uuid(), z.literal("none")]).optional().catch(undefined),
  from: isoDate("").optional().catch(undefined),
  to: isoDate("").optional().catch(undefined),
  delivered: z.literal("this-month").optional().catch(undefined),
  archived: z.enum(["only", "include"]).optional().catch(undefined),
  sort: z.enum(Object.keys(ORDER_SORTS) as [OrderSort, ...OrderSort[]]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10000).optional().catch(undefined),
})
export type OrderFilters = z.output<typeof orderFiltersSchema>

/** Parses Next's searchParams record into validated filters; bad values are dropped. */
export function parseOrderFilters(params: Record<string, string | string[] | undefined>): OrderFilters {
  const flat: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(params)) flat[key] = Array.isArray(value) ? value[0] : value
  for (const key of Object.keys(flat)) if (flat[key] === "") flat[key] = undefined
  return orderFiltersSchema.parse(flat)
}

