/** "Executive table, Visitor chair × 6 + 3 more" from the first few items and the total count. */
export function formatItemSummary(preview: ReadonlyArray<string> | null | undefined, itemCount: number): string {
  const shown = (preview ?? []).slice(0, 3)
  if (shown.length === 0) return itemCount === 0 ? "No items" : `${itemCount} items`
  const extra = itemCount - shown.length
  return extra > 0 ? `${shown.join(", ")} + ${extra} more` : shown.join(", ")
}

/** "4 of 7 items ready". */
export function formatReadyProgress(ready: number, total: number): string {
  if (total === 0) return "No items"
  if (ready === total) return total === 1 ? "The item is ready" : `All ${total} items ready`
  return `${ready} of ${total} ${total === 1 ? "item" : "items"} ready`
}
