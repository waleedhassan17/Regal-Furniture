import { describe, expect, it } from "vitest"
import { z } from "zod"
import { uuidv4 } from "@/lib/uuid"

describe("uuidv4", () => {
  it("produces valid v4 UUIDs", () => {
    expect(z.uuid().safeParse(uuidv4()).success).toBe(true)
  })
  it("falls back to getRandomValues when randomUUID is unavailable (plain-http LAN)", () => {
    const original = crypto.randomUUID
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true })
    try {
      const ids = new Set(Array.from({ length: 50 }, () => uuidv4()))
      expect(ids.size).toBe(50)
      for (const id of ids) {
        expect(z.uuid().safeParse(id).success).toBe(true)
        expect(id[14]).toBe("4")
      }
    } finally {
      Object.defineProperty(crypto, "randomUUID", { value: original, configurable: true })
    }
  })
})
