import "server-only"
import { z } from "zod"
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session"

/** Every server action returns this shape so forms can show friendly messages. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

export const SESSION_ENDED = "Your session has ended. Please sign in again."
export const NOT_ALLOWED = "You don't have permission to do that."
export const SOMETHING_WENT_WRONG = "Something went wrong. Please try again."

type Guard = "user" | "admin"

/**
 * Wraps a server action: re-checks the session and role, validates input with Zod,
 * and turns unexpected errors into a friendly message (details go to the server log).
 */
export function createAction<Schema extends z.ZodType, Output>(
  options: { schema: Schema; guard: Guard; name: string },
  handler: (input: z.output<Schema>, user: CurrentUser) => Promise<ActionResult<Output>>
) {
  return async (raw: z.input<Schema>): Promise<ActionResult<Output>> => {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: SESSION_ENDED }
    if (options.guard === "admin" && !user.isAdmin) return { ok: false, error: NOT_ALLOWED }

    const parsed = options.schema.safeParse(raw)
    if (!parsed.success) {
      return {
        ok: false,
        error: "Please check the highlighted fields.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      }
    }

    try {
      return await handler(parsed.data, user)
    } catch (error) {
      console.error(`[action:${options.name}]`, error)
      return { ok: false, error: SOMETHING_WENT_WRONG }
    }
  }
}

/** Maps a Postgres/PostgREST error to a message a non-technical user can act on. */
export function friendlyDbError(error: { code?: string; message?: string } | null, fallback = SOMETHING_WENT_WRONG) {
  if (!error) return fallback
  switch (error.code) {
    case "42501":
      return error.message && !error.message.includes("row-level security") ? error.message : NOT_ALLOWED
    case "23505":
      return "That record already exists."
    case "23503":
      return "This is linked to something that no longer exists. Refresh and try again."
    case "23514":
      return "Some values are outside the allowed range. Please check and try again."
    case "P0001":
      return error.message ?? fallback
    default:
      return fallback
  }
}
