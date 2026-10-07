import type { DashboardSummary } from "@/features/dashboard/queries"

/** One plain sentence that tells someone the state of the factory at a glance. */
export function summarySentence(s: Pick<DashboardSummary, "overdue" | "dueSoon" | "needsToStart">, dueSoonDays: number): string {
  const window = dueSoonDays === 0 ? "today" : `within ${dueSoonDays} ${dueSoonDays === 1 ? "day" : "days"}`
  const facts = [
    { n: s.overdue, one: "is overdue", many: "are overdue" },
    { n: s.dueSoon, one: `is due ${window}`, many: `are due ${window}` },
    { n: s.needsToStart, one: "hasn't been started yet", many: "haven't been started yet" },
  ].filter((f) => f.n > 0)

  if (facts.length === 0) return "Nothing needs attention right now. Every open order is on track."

  // The first fact names the noun ("3 orders are…"); later ones read on from it ("2 are…").
  const parts = facts.map((f, i) => {
    const noun = i === 0 ? (f.n === 1 ? " order" : " orders") : ""
    return `${f.n}${noun} ${f.n === 1 ? f.one : f.many}`
  })
  const sentence = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`
  return `${sentence}.`
}
