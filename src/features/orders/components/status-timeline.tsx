import { History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PRODUCTION_STATUS_TONE } from "@/components/data/status-badge"
import { formatDateTime } from "@/lib/format/date"
import { PRODUCTION_STATUS_LABEL, type ProductionStatus } from "@/lib/domain/status"

type Entry = {
  id: number
  from_status: ProductionStatus | null
  to_status: ProductionStatus
  changed_at: string
  person_name: string | null
}

/** Every status change, newest first — written by a database trigger so it can't be skipped. */
export function StatusTimeline({ entries }: { entries: Entry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History aria-hidden="true" className="size-[18px] text-stone" /> Status history
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative flex flex-col gap-5 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-sand-strong">
          {entries.map((e) => (
            <li key={e.id} className="relative pl-6">
              <span
                aria-hidden="true"
                className="absolute top-1.5 left-0 size-[11px] rounded-full border-2 border-paper"
                style={{ backgroundColor: `var(--st-${PRODUCTION_STATUS_TONE[e.to_status]}-dot)` }}
              />
              <p className="text-sm text-ink">
                {e.from_status === null ? (
                  <>
                    Order created as <strong className="font-bold">{PRODUCTION_STATUS_LABEL[e.to_status]}</strong>
                  </>
                ) : (
                  <>
                    <span className="text-stone">{PRODUCTION_STATUS_LABEL[e.from_status]}</span> →{" "}
                    <strong className="font-bold">{PRODUCTION_STATUS_LABEL[e.to_status]}</strong>
                  </>
                )}
              </p>
              <p className="text-caption text-stone">
                {formatDateTime(e.changed_at)}
                {e.person_name ? ` · ${e.person_name}` : ""}
              </p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
