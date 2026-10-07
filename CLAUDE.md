# Regal Furnitures — Factory Order Portal

Internal order-tracking portal for Regal Furnitures (Pakistani furniture maker). 5–15 staff; office on laptops, factory on Android phones over slow connections. **SPEC.md is the source of truth** (data model §3, business rules §4, security §5, screens §6, design §7). PROMPTS.md holds the phase prompts. @AGENTS.md

## Stack
- Next.js 16 (App Router, `cacheComponents` + `partialPrefetching` on), TypeScript strict, Server Components by default, Server Actions for mutations. `proxy.ts` replaces middleware in Next 16.
- With Cache Components: anything that reads cookies, `searchParams`, `params` or uncached data must render inside `<Suspense>`. Pages = static shell + suspended data components.
- Supabase (Postgres, Auth, Storage) via `@supabase/ssr`. Tailwind v4 + shadcn/ui (radix, restyled). Zod 4 + React Hook Form. Vitest.
- Bundled Next docs: `node_modules/next/dist/docs/` — read before using an unfamiliar API.

## Commands
- `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm run test`
- `npm run db:migrate` — apply new files in `supabase/migrations/` to the project in `DATABASE_URL`
- `npm run db:types` — regenerate `src/types/database.ts` from the live schema
- `npm run create-admin` — first admin from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
- `npm run db:seed` / `npm run db:seed:clear` — demo data (rows flagged `is_seed`); never clear without asking the owner
- `npm run rls:check` — signs in as admin / staff / no-profile users and asserts what each can reach
- `npm run db:check-dashboard` — recomputes dashboard numbers with independent SQL and compares

## Folder conventions
- `src/app/(auth)` login + password flows; `src/app/(app)` the signed-in portal; route files stay thin.
- `src/features/<feature>/` — `components/`, `actions.ts` (server actions), `queries.ts` (server reads), `schema.ts` (Zod, shared client/server).
- `src/components/ui` shadcn primitives (restyled); `src/components/{shell,brand,data}` shared app pieces.
- `src/lib/supabase/{server,browser,proxy,admin}.ts`; `admin.ts` is service-role and `server-only`.
- `src/lib/format/*` money/date/days-left formatting; `src/lib/auth/*` session + role helpers.
- `supabase/migrations/NNNN_name.sql` numbered; `scripts/` node scripts run with `tsx`.

## Rules for every session
- **Secrets:** read env values only via `process.env`. Never print, log, echo or copy any value from `.env.local`, and never write them to another file. Report variable *names* only.
- **Security (SPEC §5):** RLS on every table; roles enforced in the database, not just the UI. Staff never see amounts — money lives only in `order_finance` / `payments` (admin-only RLS) and the `order_balances` view. Every server action: Zod-validate input, re-check session and role (`requireUser` / `requireAdmin`). Service-role key only in `server-only` modules and scripts. Item images in the private `item-images` bucket via short-lived signed URLs; compress in browser (~1600px) before upload. Proxy redirects anonymous users; inactive users are signed out.
- **Attention logic** lives only in SQL (`compute_attention`, used by the `order_overview` view). Do not re-implement it in TypeScript.
- **Migrations:** never edit an applied migration; add a new numbered file, run `db:migrate`, then `db:types`.
- **Quality bar (SPEC §8):** no `any`; features in their own folders; friendly UI errors, details only in server logs. `lint`, `typecheck`, `test`, `build` must all pass before a phase is done. Commit locally at the end of each phase; never push.
- **Design (SPEC §7):** tokens in `src/app/globals.css` only — Bone leads, Ink anchors, Regal Red is scarce (primary actions, key figures, urgent states). Playfair Display for titles/big numbers, Montserrat elsewhere, tabular figures for money/counts. 44px tap targets, works at 360px, WCAG AA, visible focus.
- **Formats:** `Rs 125,000` (no decimals), `08 Oct 2026`, "5 days left" / "Due today" / "3 days overdue"; dates are `Asia/Karachi`.
