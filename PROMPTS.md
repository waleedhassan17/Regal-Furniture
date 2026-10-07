# Phase prompts for Claude Code

Paste one prompt at a time, in order. After each phase, test with the checklist Claude Code gives you, report any problems using the "Fix" prompt at the bottom, and only move on when the phase works.

Starting a fresh Claude Code session for each phase is fine: Phase 0 creates a `CLAUDE.md` file that carries the project context between sessions.

---

## Phase 0 — Orientation and Supabase connection

```
You're building an internal order-tracking portal for Regal Furnitures. Before writing any application code, get oriented.

1. Read SPEC.md in full. Then read every page of brand/Regal_Furnitures_Brand_Identity.pdf and look through reference/Factory_orders.xlsx, including several different tabs, so you understand how orders are recorded today.

2. Check .env.local: confirm which of the variables listed in SPEC.md section 2 are present. Report names only. Never print, log or repeat any value from that file, here or in later phases.

3. Prove you can reach my Supabase project, without changing anything in it:
   - a read-only query through DATABASE_URL (for example, select the Postgres version and list existing tables in the public schema)
   - a call with the service-role key that lists auth users and reports only the count
   If either fails, tell me exactly what to fix. A common cause is a database password with special characters that needs URL-encoding, or using the direct connection string instead of the session pooler one.

4. Create CLAUDE.md at the project root: a concise summary of what this project is, the stack, the commands, the folder conventions, and the rules from SPEC.md sections 5 and 8 that you must follow in every session. Point to SPEC.md for detail rather than copying it.

5. Give me: a short build plan, the database schema you intend to create (tables, key columns, relationships, RLS approach), and your questions, including the assumptions listed in SPEC.md section 9.

Stop there and wait for my answers. Don't scaffold the app yet.
```

---

## Phase 1 — Foundation: project, database, auth, design system

```
Phase 1. Follow SPEC.md and CLAUDE.md, with the answers I gave in Phase 0 (update SPEC.md first if any of them changed it).

Build the foundation:

1. Scaffold the Next.js app in this folder, keeping the existing files (SPEC.md, PROMPTS.md, CLAUDE.md, brand/, reference/, .env.local). Work around create-next-app's non-empty-folder check if you need to. Add Tailwind, shadcn/ui, the Supabase clients for server, browser and middleware, Zod, React Hook Form and Vitest. Add lint, typecheck, test and build scripts. Create .env.example with names only. Initialise git and confirm .env.local is ignored.

2. Design system. Translate the brand guidelines into design tokens (colour, type scale, spacing, radii) and restyle the shadcn components to match. Build the application shell: sidebar on desktop, mobile navigation, page header, and the shared pieces later phases need (status badge, days-left badge, hexagon stat card, empty state, skeletons, toasts). Add a temporary /styleguide page showing all of them so I can judge the look before real screens exist. This is the phase where the visual quality is set, so give it real care: I want this to look like a finished product from an established furniture brand, not a default template.

3. Database. Write the full schema from SPEC.md section 3 as numbered SQL migrations: tables, enums, constraints, indexes, the order-number generator, the status-history trigger, the views, the private storage bucket and its policies, and RLS policies for every table as described in section 5. Apply them to my Supabase project yourself using DATABASE_URL: try `npx supabase db push --db-url` first, and if that isn't workable, write a small migration runner script that records applied files in a table. Add `npm run db:migrate`. Then verify by querying the database that the tables, policies and bucket exist. Keep TypeScript types for the database in sync.

4. Auth. Login page per SPEC.md section 6, forgot-password flow, middleware protection, sign-out, and a profile loader that gives server code the current user's role. Write `npm run create-admin`, which uses the service-role key with SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create the first admin and their profile. Run it.

5. Test the RLS policies for real: with a script, sign in as an admin and as a temporary staff user, and confirm staff cannot read order_finance or payments and a user without a profile can read nothing. Remove the temporary user afterwards. Show me the results.

Finish by running lint, typecheck, tests and build, fixing anything that fails, and committing locally. Then give me a summary of what was built, anything you could not verify yourself, and a numbered checklist of what I should test by hand, including the login email to use.
```

---

## Phase 2 — Clients and orders

```
Phase 2. Follow SPEC.md and CLAUDE.md.

Build the core data entry and browsing:

1. Clients: list with search, create, edit, and the client page with order history.

2. New order and edit order, as described in SPEC.md section 6. Pay attention to how this form feels on a phone: it is the screen people will use most. Client search with inline creation and address prefill; items that can be added, duplicated, reordered and removed; the "more details" area for the rarely used fields; photo upload per item with in-browser compression and upload progress; unsaved-changes warning. Saving an order with its items must be atomic: either everything is saved or nothing is. The amounts section appears for admins only and writes to order_finance.

3. Orders list with search, URL-synced filters, sorting, server-side pagination, table on desktop and cards on mobile.

4. Order detail page showing everything about the order, with item photos via signed URLs. Status controls and payments come in later phases; leave clean places for them.

5. A seed script, `npm run db:seed`, that inserts about 25 realistic orders using client and item names in the style of the Excel file, with deadlines spread across the past, the next few days and the coming weeks, in mixed statuses, with some payments. Make it safe to re-run and easy to remove (`npm run db:seed:clear`), and mark seeded rows so real data is never touched. Run it.

Finish by running lint, typecheck, tests and build, fixing anything that fails, and committing locally. Then give me the summary, anything you could not verify, and a manual test checklist covering desktop and phone-width behaviour.
```

---

## Phase 3 — Status, reminders and the dashboard

```
Phase 3. Follow SPEC.md and CLAUDE.md.

This phase delivers the reason the portal exists: making sure nothing is forgotten.

1. Production status changes from the orders list and the order detail page, quick to do on a phone, with a confirmation toast and the ability to undo a mistaken tap. Item status changes on the order detail page with the "x of y items ready" progress. Status timeline on the order detail page, fed by the status_history trigger.

2. The attention logic from SPEC.md section 4, implemented once and used everywhere, reading thresholds from the settings table and using the Asia/Karachi date. Unit-test it thoroughly, including the boundaries: deadline today, deadline exactly at each threshold, the day after the deadline, and orders created exactly at the grace limit.

3. The dashboard as described in SPEC.md section 6. Someone opening it should understand the state of the factory in five seconds: what is overdue, what is due soon, what should have been started. Make the count cards link to the matching filtered list. Give the "all clear" state as much care as the busy state.

4. Days-left and attention badges on the list, the cards and the detail page, consistent everywhere.

Check the dashboard counts against direct database queries on the seed data and show me that they match.

Finish by running lint, typecheck, tests and build, fixing anything that fails, and committing locally. Then give me the summary, anything you could not verify, and a manual test checklist.
```

---

## Phase 4 — Payments, permissions in the UI, print and WhatsApp

```
Phase 4. Follow SPEC.md and CLAUDE.md.

1. Payments on the order detail page for admins: add, edit and remove a payment, with order amount, delivery charges, received and remaining shown clearly and updated immediately. Remaining balance on the orders list and client page, and total outstanding on the dashboard, for admins only. Unit-test the money calculations, including overpayment and orders with no amount set yet.

2. Role behaviour throughout the interface: staff never see money fields, payment sections, team or settings, or archive actions, and direct URL access to admin pages is refused on the server. Then verify the database side again by signing in as a staff user with a script and attempting to read and write order_finance and payments directly; show me that every attempt is refused.

3. Print job sheet: a dedicated A4 print layout per SPEC.md section 6, following the block layout of the Excel sheet, with sensible page breaks for orders with many items and images that print at a useful size. No prices. Check it using the browser's print preview with a 1-item order and a 30-item order.

4. Share on WhatsApp per SPEC.md section 6, working on both phone and desktop.

5. Archive and restore for orders (admin), with archived orders hidden by default.

Finish by running lint, typecheck, tests and build, fixing anything that fails, and committing locally. Then give me the summary, anything you could not verify, and a manual test checklist that has me log in as both an admin and a staff user.
```

---

## Phase 5 — Team, settings, polish and release preparation

```
Phase 5. Follow SPEC.md and CLAUDE.md.

1. Team page (admin): create a user with a temporary password, change role, deactivate and reactivate. A deactivated user loses access immediately. Prevent the last active admin from being deactivated or demoted.

2. Settings page (admin) for the three reminder thresholds, with a plain-language explanation of what each one does.

3. Polish pass over every screen. Go through each one at 360px, tablet and desktop widths and fix anything cramped, misaligned or inconsistent. Check loading, empty and error states exist everywhere. Check keyboard use, focus states, form labels and colour contrast. Remove the temporary /styleguide page. Add the favicon, page titles and a proper not-found page.

4. Review the app as a critical senior engineer would: look for missing validation, unhandled errors, places where a server action trusts the client, slow queries, and any way a staff user could reach money data. Fix what you find and tell me what you changed.

5. Release preparation:
   - README.md covering what the app is, local setup, the scripts, how migrations work, how to add the first admin, and how to deploy.
   - DEPLOY.md with exact steps for me: pushing to GitHub, importing into Vercel, the precise list of environment variables to add in Vercel (and which ones from .env.local must NOT be added there), and the Supabase Auth URL settings to update with the production address so password-reset links work.
   - Remove the seed data (`npm run db:seed:clear`) only after asking me.

Finish by running lint, typecheck, tests and a production build, fixing anything that fails, and committing locally. Then give me the summary and a final end-to-end manual test script that walks through a complete order from creation to delivery.
```
