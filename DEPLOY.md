# Deploying the Regal order portal

These steps take the app from this folder to a live address on Vercel, using your existing Supabase project. Allow about 20 minutes.

## 1. Make sure the database is ready

From this folder, run these steps in order:

```bash
npm run db:migrate     # applies any new migrations
npm run create-admin   # creates or keeps the first admin
npm run rls:check      # every line should show ✓
```

If you loaded demo data with `npm run db:seed`, remove it before real use. This removes only the demo rows:

```bash
npm run db:seed:clear
```

## 2. Push the code to GitHub

1. On github.com, create a new **private** repository, for example `regal-portal`. Leave it empty, with no README.
2. In this folder, run the following, replacing `YOUR-USER` with your GitHub user name:

   ```bash
   git remote add origin https://github.com/YOUR-USER/regal-portal.git
   git push -u origin main
   ```

`.env.local` is ignored by git, so your keys are not uploaded. You can confirm this with `git check-ignore .env.local`, which should print `.env.local`.

## 3. Import the project into Vercel

1. Go to vercel.com → **Add New… → Project**, and import the GitHub repository.
2. Leave the defaults: Framework **Next.js**, Root Directory `./`, the default build command and the default output.
3. Before the first deploy, open **Environment Variables** and add the variables in step 4.
4. Under **Settings → Functions → Function Region**, choose the region closest to your Supabase project. For example, if Supabase is in Mumbai (`ap-south-1`), choose Mumbai (`bom1`). This keeps pages fast for users in Pakistan.
5. Click **Deploy**.

## 4. Environment variables on Vercel

**Add exactly these.** Apply them to Production, and to Preview if you use preview deployments.

| Name | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | same as in `.env.local` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same as in `.env.local` | Safe to expose to the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | same as in `.env.local` | Needed by the Team page to create and deactivate accounts. Mark it **Sensitive**. |
| `NEXT_PUBLIC_SITE_URL` | your production address, e.g. `https://orders.regalpk.com` | Used in WhatsApp links. No trailing slash. |

**Do NOT add these to Vercel.** They are only for scripts run from your computer:

| Name | Why it stays local |
|---|---|
| `DATABASE_URL` | Full database password; only `db:migrate`, `db:types` and the check scripts use it |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` | Used once by `create-admin` |

After changing variables in Vercel, redeploy (**Deployments → ⋯ → Redeploy**) so they take effect.

## 5. Supabase Auth settings (needed for password-reset emails)

In the Supabase dashboard, open **Authentication**.

1. In **URL Configuration**:
   - Set **Site URL** to your production address, e.g. `https://orders.regalpk.com`.
   - Under **Redirect URLs**, add both of these:
     - `https://orders.regalpk.com/**`
     - `http://localhost:3000/**` (keeps reset links working during local development)

   Without these, password-reset links send people to the wrong address.
2. In **Sign In / Providers → Email**, turn **off** "Allow new users to sign up". Only admins create accounts, from the Team page. The database already gives nothing to self-registered users, but this closes the door completely.
3. In **Emails → SMTP Settings**, consider your email provider. Supabase's built-in email sender is limited to a few messages per hour, which is fine for occasional password resets. If staff reset passwords often, set up your own SMTP provider here, for example Gmail SMTP, Brevo or Resend.

## 6. Check the live site

1. Open the production address. You should see the Regal sign-in page.
2. Sign in as the admin, and check that the dashboard loads.
3. Use **Forgot your password?** with a real mailbox. The link in the email should open "Choose a new password" on your domain.
4. Create a staff account on the **Team** page and sign in with it on a phone. It must not show any amounts.
5. On an order, try **Share** (WhatsApp should open) and **Job sheet** (open the print preview and choose A4).

## Later updates

1. Commit and push to `main`. Vercel deploys automatically.
2. If the change includes a new migration, run `npm run db:migrate` from your computer **before** pushing, so the new code never runs against an old schema.

## Custom domain (optional)

1. In Vercel, go to **Settings → Domains** and add, for example, `orders.regalpk.com`. Add the DNS record Vercel shows you at your domain registrar.
2. Then update `NEXT_PUBLIC_SITE_URL`, and the Supabase **Site URL** and **Redirect URLs**, to the new address.
