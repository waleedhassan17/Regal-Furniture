# Regal Furnitures — Factory Order Portal

An internal web app where every Regal order lives in one place. Office staff enter orders with their items, photos and amounts. Factory staff update progress from their phones. The dashboard shows straight away what is overdue, what is due soon and what hasn't been started.

- **Landing page and sign-in:** a branded home page, then a choice of *Office & admin* or *Factory staff* before signing in. The server checks the chosen role against the account.
- **Dashboard:** counts for overdue, due soon, needs to start, in production, ready and delivered this month. Below them is a "Needs attention" list, most urgent first. Admins also see the outstanding balance.
- **Orders:**
  - search by client, phone, order or bill number
  - filters kept in the URL
  - a table on desktop and cards on phones
  - status changes from the list, with an Undo button in the confirmation
- **Order form:** one page with client search and inline "new client", items you can add, duplicate, reorder and remove, phone-camera photos compressed before upload, live totals and an unsaved-changes warning. Saving is all-or-nothing.
- **Order page:**
  - status, and a per-item status ("4 of 7 items ready")
  - photos, notes and status history
  - payments and remaining balance (admins only)
  - a printable A4 job sheet with no prices
  - Share on WhatsApp (no prices)
  - archive and restore
- **Clients, Team and Settings:** client history and balances; create, deactivate and reactivate users; set the three reminder thresholds.

The product specification is in [SPEC.md](SPEC.md). Deployment steps are in [DEPLOY.md](DEPLOY.md).

## Stack

The app uses:
- Next.js 16 (App Router, Server Components, Server Actions, Cache Components)
- TypeScript in strict mode
- Supabase: Postgres, Auth and Storage, via `@supabase/ssr`
- Tailwind CSS v4 and shadcn/ui, restyled to the Regal brand
- Zod and React Hook Form
- Vitest

It is hosted on Vercel.

## Local setup

Requirements: Node.js 22.9 or newer, npm, and a Supabase project.

1. Install dependencies:

   ```bash
   npm install
   ```
2. Create `.env.local`. Use `.env.example` as the list of names.

   | Variable | Where it comes from |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (anon / publishable key) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (service role / secret key). **Server only.** |
   | `DATABASE_URL` | Supabase → **Connect → Session pooler** URI. URL-encode special characters in the password. Used only by the npm scripts. |
   | `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` | Your choice. Used once by `npm run create-admin`. |
   | `NEXT_PUBLIC_SITE_URL` | Optional. Base URL for links shared on WhatsApp. |

3. Apply the database schema, generate the database types and create the first admin:

   ```bash
   npm run db:migrate
   npm run db:types
   npm run create-admin
   ```
4. Optionally, load the demo data:

   ```bash
   npm run db:seed
   ```
5. Start the app:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000, choose **Office & admin**, and sign in with `SEED_ADMIN_EMAIL`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates the Next route types, then runs `tsc --noEmit` |
| `npm run test` | Vitest: unit tests, plus database-backed attention tests when `DATABASE_URL` is set |
| `npm run db:migrate` | Applies new files in `supabase/migrations/` (via `supabase db push`) |
| `npm run db:types` | Regenerates `src/types/database.ts` from the live schema |
| `npm run create-admin` | Creates or promotes the first admin from `SEED_ADMIN_*`. Safe to re-run. |
| `npm run db:seed` | Adds about 25 realistic demo orders, flagged `is_seed`. Safe to re-run. |
| `npm run db:seed:clear` | Removes the demo data, and nothing else. |
| `npm run rls:check` | Signs in as a temporary admin, a staff user and a user with no profile, and proves what each can and cannot reach. Cleans up after itself. |
| `npm run db:check-dashboard` | Recomputes every dashboard number with independent SQL and compares. |

## Database and migrations

- **Applying changes.** The schema lives in numbered SQL files in `supabase/migrations/`. `npm run db:migrate` applies the ones not yet applied, and records them in `supabase_migrations.schema_migrations`.
- **Never edit an applied migration.** Add a new numbered file, run `db:migrate`, then `db:types`, and commit all three.
- **Money is in its own tables.** Amounts live in `order_finance` and `payments`, which only admins can read or write. That separation is what lets Row Level Security hide money from staff.
- **Attention logic lives in one place.** That place is the SQL function `compute_attention`, used by the `order_overview` view. The tests in `tests/attention.db.test.ts` call that same function.
- **Status history can't be skipped.** It is written by a trigger. Order numbers (`RF-YYYY-NNNN`) also come from a trigger.

## Security model

- **Every table has RLS.** A signed-in user with no active profile reads nothing.
- **Staff limits are enforced by the database.** Staff can read orders, change order and item status, and add notes. Triggers stop them changing anything else. They cannot see `order_finance`, `payments` or `order_balances`.
- **Server actions check everything again.** Each one validates its input with Zod and re-checks the session and role. Admin pages are refused on the server with a 403.
- **The service-role key stays on the server.** It is used only in `src/lib/supabase/admin.ts`, a `server-only` module used for team management, and in the scripts.
- **Item photos are private.** They sit in the private `item-images` bucket and are shown through one-hour signed URLs.
- **Deactivation takes effect at once.** Deactivated users are signed out on their next request, and also banned in Supabase Auth.

## Project structure

```
src/app/page.tsx      public landing page
src/app/(auth)        role choice, login, forgot and reset password
src/app/(app)         the signed-in portal (dashboard, orders, clients, team, settings)
src/app/(print)       print views (A4 job sheet)
src/features/<name>/  components/, actions.ts (server actions), queries.ts (server reads), schema.ts (Zod)
src/components/       ui/ (restyled shadcn), shell/, brand/, data/
src/lib/              supabase clients, auth/session, formatting, validation
supabase/migrations/  numbered SQL migrations
scripts/              migrate, types, create-admin, seed, RLS and dashboard checks
tests/                database-backed tests
```

## Brand assets

`src/components/brand/brand-assets.ts` points at the logo files in `public/brand/`. If no files are listed there, the app uses a plain text wordmark and a typographic favicon. To use the supplied artwork:
1. Copy the lockup and mark (SVG preferred) into `public/brand/`.
2. Fill in their paths and sizes in `brand-assets.ts`.
3. Replace `src/app/icon.svg` with the mark.
