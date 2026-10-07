"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        onClick={() =>
          toast.success("Status changed to In production", {
            description: "RF-2026-0042 · Hamza Sb",
            action: { label: "Undo", onClick: () => toast("Change undone") },
          })
        }
      >
        Success with undo
      </Button>
      <Button variant="outline" onClick={() => toast.error("We couldn't save the order. Please try again.")}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast("Link copied")}>
        Neutral
      </Button>
    </div>
  )
}
