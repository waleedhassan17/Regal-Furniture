import { describe, expect, it } from "vitest"
import { formatItemSummary, formatReadyProgress } from "@/lib/format/items"

describe("formatItemSummary", () => {
  it("lists up to three items and counts the rest", () => {
    expect(formatItemSummary(["Table", "Chair × 6", "Rack"], 5)).toBe("Table, Chair × 6, Rack + 2 more")
    expect(formatItemSummary(["Table"], 1)).toBe("Table")
  })
  it("handles empty orders", () => {
    expect(formatItemSummary([], 0)).toBe("No items")
    expect(formatItemSummary(null, 0)).toBe("No items")
  })
})

describe("formatReadyProgress", () => {
  it("phrases item readiness", () => {
    expect(formatReadyProgress(4, 7)).toBe("4 of 7 items ready")
    expect(formatReadyProgress(7, 7)).toBe("All 7 items ready")
    expect(formatReadyProgress(1, 1)).toBe("The item is ready")
    expect(formatReadyProgress(0, 1)).toBe("0 of 1 item ready")
  })
})
