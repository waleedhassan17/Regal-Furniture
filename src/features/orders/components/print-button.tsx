"use client"

import { useEffect } from "react"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PrintButton({ autoPrint = false }: { autoPrint?: boolean }) {
  useEffect(() => {
    if (!autoPrint) return
    const id = setTimeout(() => window.print(), 400)
    return () => clearTimeout(id)
  }, [autoPrint])
  return (
    <Button onClick={() => window.print()}>
      <Printer aria-hidden="true" /> Print
    </Button>
  )
}
