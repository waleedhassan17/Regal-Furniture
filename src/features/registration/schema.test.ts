import { describe, expect, it } from "vitest"
import { registerSchema, type RegisterFormValues } from "@/features/registration/schema"

const valid: RegisterFormValues = {
  company_name: "Regal Furnitures",
  company_phone: "042-35761900",
  company_email: "",
  company_city: "Lahore",
  company_address: "",
  company_website: "regalpk.com",
  owner_name: "Ayesha Raza",
  owner_phone: "",
  email: "  Owner@RegalPK.com ",
  password: "Strong-Pass-2026",
  confirm: "Strong-Pass-2026",
  setup_code: "",
}

describe("registerSchema", () => {
  it("accepts a complete registration and tidies the values", () => {
    const result = registerSchema.parse(valid)
    expect(result.email).toBe("owner@regalpk.com")
    expect(result.company_email).toBeNull()
    expect(result.owner_phone).toBeNull()
    expect(result.company_city).toBe("Lahore")
  })
  it("requires the company and owner names", () => {
    const result = registerSchema.safeParse({ ...valid, company_name: " ", owner_name: "" })
    expect(result.success).toBe(false)
    const fields = result.success ? [] : result.error.issues.map((i) => i.path[0])
    expect(fields).toEqual(expect.arrayContaining(["company_name", "owner_name"]))
  })
  it("rejects a short password and mismatched confirmation", () => {
    expect(registerSchema.safeParse({ ...valid, password: "short", confirm: "short" }).success).toBe(false)
    const mismatch = registerSchema.safeParse({ ...valid, confirm: "Different-Pass-1" })
    expect(mismatch.success).toBe(false)
    expect(mismatch.success ? null : mismatch.error.issues[0].path).toEqual(["confirm"])
  })
  it("rejects invalid emails but allows a blank company email", () => {
    expect(registerSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false)
    expect(registerSchema.safeParse({ ...valid, company_email: "info@" }).success).toBe(false)
    expect(registerSchema.safeParse({ ...valid, company_email: "" }).success).toBe(true)
  })
})
