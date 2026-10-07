import { describe, expect, it } from "vitest"
import { digitsOnly, pageRange, sanitizeSearch } from "@/lib/search"

describe("sanitizeSearch", () => {
  it("removes characters that would break a PostgREST filter", () => {
    expect(sanitizeSearch("Hamza, (Sb).*")).toBe("Hamza Sb")
    expect(sanitizeSearch('a"b\\c%d:e')).toBe("a b c d e")
  })
  it("trims and caps length", () => {
    expect(sanitizeSearch("   ")).toBe("")
    expect(sanitizeSearch("x".repeat(100))).toHaveLength(60)
    expect(sanitizeSearch(null)).toBe("")
  })
})

describe("helpers", () => {
  it("extracts digits from phone numbers", () => {
    expect(digitsOnly("0300-123 4567")).toBe("03001234567")
  })
  it("computes inclusive page ranges", () => {
    expect(pageRange(1)).toEqual([0, 19])
    expect(pageRange(3)).toEqual([40, 59])
    expect(pageRange(0)).toEqual([0, 19])
  })
})
