/**
 * The attention rules (SPEC §4) live in one place: the SQL function compute_attention,
 * used by the order_overview view. These tests call that function in the database
 * with fixed dates, so they test the real logic the app uses — not a copy of it.
 * They need DATABASE_URL (in .env.local) and are skipped without it.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { Client } from "pg"

type Status = "new" | "in_production" | "ready_for_delivery" | "delivered" | "on_hold" | "cancelled"

const url = process.env.DATABASE_URL
const TODAY = "2026-10-08"
const DEFAULTS = { dueSoon: 3, startWarning: 10, grace: 2 }

let db: Client

function plusDays(days: number) {
  const d = new Date(`${TODAY}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

async function attention(
  status: Status,
  deadlineInDays: number,
  { receivedDaysAgo = 0, archived = false, thresholds = DEFAULTS } = {}
): Promise<string | null> {
  const { rows } = await db.query<{ level: string | null }>(
    "select public.compute_attention($1::public.production_status, $2, $3::date, $4::date, $5::date, $6, $7, $8) as level",
    [status, archived, plusDays(deadlineInDays), plusDays(-receivedDaysAgo), TODAY, thresholds.dueSoon, thresholds.startWarning, thresholds.grace]
  )
  return rows[0].level
}

describe.skipIf(!url)("attention rules (compute_attention in the database)", () => {
  beforeAll(async () => {
    const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url ?? "")
    db = new Client({ connectionString: url, ssl: isLocal ? false : { rejectUnauthorized: false } })
    await db.connect()
  })
  afterAll(async () => {
    await db?.end()
  })

  describe("overdue", () => {
    it("is overdue the day after the deadline", async () => {
      expect(await attention("in_production", -1)).toBe("overdue")
    })
    it("is overdue long after the deadline, whatever the status", async () => {
      expect(await attention("new", -30, { receivedDaysAgo: 60 })).toBe("overdue")
      expect(await attention("ready_for_delivery", -5)).toBe("overdue")
      expect(await attention("on_hold", -2)).toBe("overdue")
    })
  })

  describe("due soon", () => {
    it("is due soon when the deadline is today", async () => {
      expect(await attention("in_production", 0)).toBe("due_soon")
    })
    it("is due soon exactly at the due-soon threshold", async () => {
      expect(await attention("in_production", 3)).toBe("due_soon")
    })
    it("is not due soon one day past the threshold", async () => {
      expect(await attention("in_production", 4)).toBe("on_track")
    })
    it("wins over needs-to-start (first match wins)", async () => {
      expect(await attention("new", 2, { receivedDaysAgo: 20 })).toBe("due_soon")
    })
    it("follows the configured threshold", async () => {
      const thresholds = { dueSoon: 0, startWarning: 10, grace: 2 }
      expect(await attention("in_production", 0, { thresholds })).toBe("due_soon")
      expect(await attention("in_production", 1, { thresholds })).toBe("on_track")
    })
  })

  describe("needs to start", () => {
    it("flags a New order exactly at the start-warning threshold", async () => {
      expect(await attention("new", 10)).toBe("needs_to_start")
    })
    it("does not flag a fresh New order one day past the start-warning threshold", async () => {
      expect(await attention("new", 11)).toBe("on_track")
    })
    it("does not flag an order received exactly at the grace limit", async () => {
      expect(await attention("new", 30, { receivedDaysAgo: 2 })).toBe("on_track")
    })
    it("flags an order received one day past the grace limit", async () => {
      expect(await attention("new", 30, { receivedDaysAgo: 3 })).toBe("needs_to_start")
    })
    it("only applies to orders still marked New", async () => {
      expect(await attention("in_production", 5, { receivedDaysAgo: 20 })).toBe("on_track")
      expect(await attention("on_hold", 8, { receivedDaysAgo: 20 })).toBe("on_track")
    })
  })

  describe("closed orders", () => {
    it("has no attention level once delivered, cancelled or archived", async () => {
      expect(await attention("delivered", -5)).toBeNull()
      expect(await attention("cancelled", -5)).toBeNull()
      expect(await attention("new", -5, { archived: true })).toBeNull()
    })
  })

  describe("days left in the order_overview view", () => {
    it("uses the Asia/Karachi calendar date", async () => {
      const { rows } = await db.query<{ karachi: string; view: string }>(
        "select (now() at time zone 'Asia/Karachi')::date::text as karachi, private.karachi_today()::text as view"
      )
      expect(rows[0].view).toBe(rows[0].karachi)
    })
  })
})

describe.runIf(!url)("attention rules", () => {
  it.skip("skipped: set DATABASE_URL in .env.local to run the database-backed attention tests", () => {})
})
