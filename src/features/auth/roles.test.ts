import { describe, expect, it } from "vitest"
import { loginHref, parseSignInRole } from "@/features/auth/roles"

describe("sign-in roles", () => {
  it("accepts only the two real roles", () => {
    expect(parseSignInRole("admin")).toBe("admin")
    expect(parseSignInRole("staff")).toBe("staff")
    expect(parseSignInRole("owner")).toBeNull()
    expect(parseSignInRole(undefined)).toBeNull()
  })
  it("builds login links that keep the destination", () => {
    expect(loginHref("staff")).toBe("/login?role=staff")
    expect(loginHref("admin", "/orders/abc")).toBe("/login?role=admin&next=%2Forders%2Fabc")
    expect(loginHref(null, "/orders")).toBe("/login?next=%2Forders")
    expect(loginHref(null)).toBe("/login")
  })
})
