import type { Enums } from "@/types/database"
import { Constants } from "@/types/database"

export type ProductionStatus = Enums<"production_status">
export type ItemStatus = Enums<"item_status">
export type AttentionLevel = Enums<"attention_level">
export type PaymentMethod = Enums<"payment_method">

export const PRODUCTION_STATUSES = Constants.public.Enums.production_status
export const ITEM_STATUSES = Constants.public.Enums.item_status
export const ATTENTION_LEVELS = Constants.public.Enums.attention_level
export const PAYMENT_METHODS = Constants.public.Enums.payment_method

export const PRODUCTION_STATUS_LABEL: Record<ProductionStatus, string> = {
  new: "New",
  in_production: "In production",
  ready_for_delivery: "Ready for delivery",
  delivered: "Delivered",
  on_hold: "On hold",
  cancelled: "Cancelled",
}

export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  pending: "Pending",
  in_production: "In production",
  ready: "Ready",
}

export const ATTENTION_LABEL: Record<AttentionLevel, string> = {
  overdue: "Overdue",
  due_soon: "Due soon",
  needs_to_start: "Needs to start",
  on_track: "On track",
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
  other: "Other",
}

/** Statuses that end an order's life; they have no attention level. */
export const CLOSED_STATUSES: ReadonlyArray<ProductionStatus> = ["delivered", "cancelled"]

export function isProductionStatus(value: unknown): value is ProductionStatus {
  return typeof value === "string" && (PRODUCTION_STATUSES as ReadonlyArray<string>).includes(value)
}

export function isAttentionLevel(value: unknown): value is AttentionLevel {
  return typeof value === "string" && (ATTENTION_LEVELS as ReadonlyArray<string>).includes(value)
}
