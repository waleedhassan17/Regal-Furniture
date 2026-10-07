import { describe, expect, it } from "vitest"
import { summarySentence } from "@/features/dashboard/summary-sentence"

describe("summarySentence", () => {
  it("says all clear when nothing needs attention", () => {
    expect(summarySentence({ overdue: 0, dueSoon: 0, needsToStart: 0 }, 3)).toBe(
      "Nothing needs attention right now. Every open order is on track."
    )
  })
  it("joins the parts naturally", () => {
    expect(summarySentence({ overdue: 3, dueSoon: 2, needsToStart: 1 }, 3)).toBe(
      "3 orders are overdue, 2 are due within 3 days and 1 hasn't been started yet."
    )
    expect(summarySentence({ overdue: 1, dueSoon: 0, needsToStart: 0 }, 3)).toBe("1 order is overdue.")
    expect(summarySentence({ overdue: 0, dueSoon: 1, needsToStart: 4 }, 1)).toBe("1 order is due within 1 day and 4 haven't been started yet.")
  })
})
