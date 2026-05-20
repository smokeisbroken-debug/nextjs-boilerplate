# v58.18 — Final Security Verification Checklist

## Purpose

This pack is the final manual verification layer after:

- `v58.16 — Security Audit & Guard Rails`
- `v58.17 — Supabase RLS / Permissions Review Pack`

It does **not** change the app code, Supabase schema, Telegram webhook logic, or user data. It is a checklist for confirming that the app is secure enough to return to product work.

---

## Verification result

Use this result at the end:

```txt
v58.18 status: PASS / NEEDS FIX
Date:
Checked by:
Production URL:
Telegram bot:
Supabase project:
Notes:
```

Do not mark this as `PASS` until all critical checks below are completed.

---

# 1. Required Vercel environment variables

Open **Vercel → Project → Settings → Environment Variables**.

## Required

Confirm these exist in Production:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
TELEGRAM_SETUP_SECRET
WEB_AUTH_SECRET
CRON_SECRET
```

## Optional but recommended

```txt
DIAGNOSTICS_SECRET
NOTIFICATIONS_SECRET
COMMUNITY_WEB_POSTING_ENABLED=false
COMMUNITY_WRITE_SECRET
```

## Must not exist

No secret should use the public Next.js prefix:

```txt
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ❌
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN ❌
NEXT_PUBLIC_TELEGRAM_WEBHOOK_SECRET ❌
NEXT_PUBLIC_TELEGRAM_SETUP_SECRET ❌
NEXT_PUBLIC_WEB_AUTH_SECRET ❌
NEXT_PUBLIC_CRON_SECRET ❌
```

Only non-secret client values should use `NEXT_PUBLIC_`.

---

# 2. Public endpoint guard checks

Replace:

```txt
https://YOUR-DOMAIN.vercel.app
```

with the production app URL.

## 2.1 Telegram set webhook endpoint

Open without secret:

```txt
https://YOUR-DOMAIN.vercel.app/api/telegram/set-webhook
```

Expected:

```txt
401 / 403 / unauthorized
```

It must **not** set the webhook without `?key=TELEGRAM_SETUP_SECRET`.

Then test with secret only when needed:

```txt
https://YOUR-DOMAIN.vercel.app/api/telegram/set-webhook?key=YOUR_TELEGRAM_SETUP_SECRET
```

Expected:

```txt
ok / webhook set
```

## 2.2 Telegram delete webhook endpoint

Open without secret:

```txt
https://YOUR-DOMAIN.vercel.app/api/telegram/delete-webhook
```

Expected:

```txt
401 / 403 / unauthorized
```

Do **not** run the delete endpoint with the real key unless you intentionally want to remove the Telegram webhook.

## 2.3 Telegram webhook endpoint

A direct random request to:

```txt
https://YOUR-DOMAIN.vercel.app/api/telegram
```

without Telegram's secret header should not be accepted as a trusted webhook update.

Expected:

```txt
401 / 403 / ignored / invalid method
```

The important point: a random public request must not be able to impersonate Telegram.

## 2.4 Supabase diagnostics endpoint

Open without secret:

```txt
https://YOUR-DOMAIN.vercel.app/api/broke?check=supabase
```

Expected:

```txt
401 / 403 / unauthorized
```

With `DIAGNOSTICS_SECRET` or `TELEGRAM_SETUP_SECRET`, it may show diagnostics. Without a secret, it must not expose env/table details.

## 2.5 Gentle notifications cron

Call without secret:

```txt
https://YOUR-DOMAIN.vercel.app/api/notifications/gentle
```

Expected:

```txt
401 / 403 / unauthorized
```

If the route only supports POST, `405 Method Not Allowed` is also acceptable for a plain browser GET.

## 2.6 Community web posting

If `COMMUNITY_WEB_POSTING_ENABLED` is missing or set to `false`, public website posting to Telegram must not work.

Expected:

```txt
disabled / unauthorized / forbidden
```

Only enable this intentionally with:

```txt
COMMUNITY_WEB_POSTING_ENABLED=true
COMMUNITY_WRITE_SECRET=strong-random-secret
```

## 2.7 Share image upload checks

Try uploading a non-image or very large file through the share endpoint if you have a safe local test request.

Expected:

```txt
wrong type rejected
oversized file rejected
normal share flow still works
```

---

# 3. Supabase RLS verification

Run this first in Supabase SQL Editor:

```txt
supabase/review/20260520_v58_17_rls_audit.sql
```

If you do not have the file open from v58.17, use the copy inside this v58.18 pack:

```txt
supabase/review/20260520_v58_18_post_rls_audit.sql
```

## Expected for existing $BROKE tables

```txt
table_exists = true
rls_enabled = true
rls_forced = true
policies = (no policies)
```

## Expected grants

```txt
service_role: SELECT, INSERT, UPDATE, DELETE
anon: no table grants
authenticated: no table grants
```

## Required columns

These should exist:

```txt
broke_settings.settings_payload
broke_settings.app_state_payload
broke_expenses.currency
```

Missing optional tables are not automatically a blocker if the feature is not used, but missing required columns should be fixed.

---

# 4. Functional regression checks after security hardening

Security is not finished unless the app still works.

## 4.1 First user flow

Check:

```txt
Open app → onboarding → Fast start: Track leak → save first leak
```

Expected:

```txt
User reaches Track Leak quickly
Leak saves successfully
Home updates
Chart updates
```

## 4.2 Track Leak + triggers

Create a test leak with:

```txt
Amount: small test amount
Category: any
Decision: Grey zone or Full leak
Triggers: Stress + Late night or Weekend
Note: optional
```

Expected:

```txt
Leak saves
Trigger tags remain in notes or pattern data
Chart / Leak Pattern Lab can read the signal
```

## 4.3 Cloud sync / settings

Change one harmless setting, then reload.

Expected:

```txt
Setting persists
No unauthorized errors in UI
No data disappears
```

## 4.4 Currency and old-data repair

Check Settings:

```txt
Display Currency
Currency Mode
Old Data Currency Repair
```

Expected:

```txt
Settings load
No broken exchange-rate warning unless external rates fail
Repair panel is visible and does not auto-run accidentally
```

## 4.5 Telegram Mini App

Open from Telegram bot button.

Expected:

```txt
Mini App opens
Telegram initData auth works
Expenses load/save
No blank screen
```

## 4.6 Web manual link

Check manual Telegram/Web link if available.

Expected:

```txt
Link code flow still works
No account collision
Same user data appears after link
```

## 4.7 Share flows

Check:

```txt
Daily share/result
Growth share card
Survival card
Weekly Review
Monthly Leak History
```

Expected:

```txt
Card generation works
Toast feedback appears
No browser alert regression
No private debt details exposed
```

---

# 5. GitHub repository checks

Open GitHub repo.

## 5.1 No secrets committed

Search the repo for:

```txt
SUPABASE_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
TELEGRAM_SETUP_SECRET
WEB_AUTH_SECRET
CRON_SECRET
service_role
.env
```

Expected:

```txt
No real secret values in code
Only documentation/template references
.env files are not committed
```

## 5.2 GitHub secret scanning

Enable if available:

```txt
Settings → Code security and analysis → Secret scanning
Settings → Code security and analysis → Dependabot alerts
```

## 5.3 Branch safety

Recommended:

```txt
main branch protected
pull requests required before merge if a team joins
force pushes disabled
at least one rollback-ready deployment exists in Vercel
```

For a solo early-stage project, branch protection can be lighter, but never commit `.env` or service-role keys.

---

# 6. Vercel project checks

## 6.1 Deployment protection

Check:

```txt
Only GitHub repo owner/team can deploy
Preview deployments do not expose production-only secrets unnecessarily
Production secrets are scoped to Production where possible
```

## 6.2 Build logs

Look through latest production build logs.

Expected:

```txt
No secret values printed
No env dump
No stack trace exposing tokens
No suspicious external script URLs added
```

## 6.3 Domains

Check:

```txt
Production domain is correct
Old test domains are not advertised
Telegram webhook points to the production domain
```

---

# 7. Dependency check

Run locally:

```bash
npm audit
```

If it reports a Next.js security fix, update Next in a separate dependency-only patch.

Recommended future patch if needed:

```txt
v58.19 — Dependency Security Update
```

Do not mix dependency upgrades with product UI changes.

---

# 8. Pass / fail rules

## Critical blockers

Do not mark v58.18 as PASS if any of these are true:

```txt
/api/telegram/set-webhook works without key
/api/telegram/delete-webhook works without key
/api/broke?check=supabase exposes diagnostics without key
notification cron runs without secret
Supabase anon/authenticated can read/write BROKE tables directly
SUPABASE_SERVICE_ROLE_KEY is exposed in GitHub or NEXT_PUBLIC env
Telegram bot token is exposed in GitHub or NEXT_PUBLIC env
App can no longer save/load user expenses
```

## Acceptable non-blockers

These can be fixed later:

```txt
Minor UI spacing issue
Optional table missing for unused feature
npm audit moderate issue that does not have a safe immediate patch
One share card style mismatch
Documentation still mentioning older version number
```

---

# 9. Final sign-off template

Use this message internally when done:

```txt
v58.18 Final Security Verification: PASS

Checked:
- endpoint guard rails
- Supabase RLS/grants
- required columns
- GitHub secret scan/manual search
- Vercel env names and build logs
- Telegram Mini App auth
- Track Leak save/load
- Chart / Leak Pattern Lab
- share cards

Known non-blockers:
- ...

Next recommended version:
- v58.19 Dependency Security Update, if npm audit still flags Next.js
- otherwise return to product polish
```
