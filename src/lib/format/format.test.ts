import { describe, expect, it } from "vitest"
import { formatMoney } from "@/lib/format/money"
import { addDays, daysBetween, formatDate, formatDateTime, karachiToday, longToday } from "@/lib/format/date"
import { formatDaysLeft } from "@/lib/format/days-left"

describe("formatMoney", () => {
  it("formats whole rupees with grouping and no decimals", () => {
    expect(formatMoney(125000)).toBe("Rs 125,000")
    expect(formatMoney(0)).toBe("Rs 0")
    expect(formatMoney(1250000)).toBe("Rs 1,250,000")
    expect(formatMoney(999.6)).toBe("Rs 1,000")
  })
  it("shows negatives with a leading minus", () => {
    expect(formatMoney(-5000)).toBe("-Rs 5,000")
  })
  it("renders a dash for missing amounts", () => {
    expect(formatMoney(null)).toBe("—")
    expect(formatMoney(undefined)).toBe("—")
  })
})

describe("dates", () => {
  it("formats calendar dates as 08 Oct 2026", () => {
    expect(formatDate("2026-10-08")).toBe("08 Oct 2026")
    expect(formatDate("2026-01-31")).toBe("31 Jan 2026")
    expect(formatDate(null)).toBe("—")
  })
  it("reads timestamps in Karachi time (UTC+5)", () => {
    // 20:30 UTC on 7 Oct is 01:30 on 8 Oct in Karachi.
    expect(formatDate("2026-10-07T20:30:00Z")).toBe("08 Oct 2026")
    expect(formatDateTime("2026-10-07T20:30:00Z")).toBe("08 Oct 2026, 1:30 am")
  })
  it("knows today's date in Karachi across the UTC day boundary", () => {
    expect(karachiToday(new Date("2026-10-07T18:59:59Z"))).toBe("2026-10-07")
    expect(karachiToday(new Date("2026-10-07T19:00:00Z"))).toBe("2026-10-08")
  })
  it("counts and adds whole days", () => {
    expect(daysBetween("2026-10-08", "2026-10-13")).toBe(5)
    expect(daysBetween("2026-10-08", "2026-10-05")).toBe(-3)
    expect(daysBetween("2026-02-27", "2026-03-01")).toBe(2)
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02")
  })
})

describe("formatDaysLeft", () => {
  it("phrases days left, due today and overdue", () => {
    expect(formatDaysLeft(5)).toBe("5 days left")
    expect(formatDaysLeft(1)).toBe("1 day left")
    expect(formatDaysLeft(0)).toBe("Due today")
    expect(formatDaysLeft(-1)).toBe("1 day overdue")
    expect(formatDaysLeft(-3)).toBe("3 days overdue")
  })
})


describe("longToday", () => {
  it("writes the long date in Karachi time", () => {
    expect(longToday(new Date("2026-10-08T03:00:00Z"))).toBe("Thursday 08 Oct 2026")
    expect(longToday(new Date("2026-10-07T19:30:00Z"))).toBe("Thursday 08 Oct 2026")
  })
})
