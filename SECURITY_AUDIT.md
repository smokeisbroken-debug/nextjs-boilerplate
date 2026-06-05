# v58.16 Security Audit & Guard Rails

Current base audited: v58.15 Fast Start Onboarding.

## Result

No real secrets were found in the project archive. `.gitignore` excludes `.env*`, `.vercel`, `.pem`, build output, and `node_modules`.

The app still depends on server-side secrets in Vercel:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_SETUP_SECRET`
- `WEB_AUTH_SECRET`
- `CRON_SECRET` or `NOTIFICATIONS_SECRET`

Do not commit any of these to GitHub.

## Supabase tables used by the app

Core app tables:

- `broke_users`
- `broke_settings`
- `broke_expenses`
- `broke_streaks`
- `broke_challenges`
- `broke_user_challenges`
- `broke_user_badges`
- `broke_xp_events`
- `broke_leaderboard_profiles`

Feature/support tables:

- `broke_exchange_rates`
- `broke_web_link_codes`
- `broke_community_messages`
- `broke_notification_logs`

Important columns:

- `broke_settings.settings_payload` jsonb
- `broke_settings.app_state_payload` jsonb
- `broke_expenses.currency` text/varchar

## Changes in this hardening patch

- Telegram webhook POST now requires `TELEGRAM_WEBHOOK_SECRET`.
- Webhook setup/delete endpoints now require `TELEGRAM_SETUP_SECRET`.
- Gentle notification cron endpoint now requires `CRON_SECRET` or `NOTIFICATIONS_SECRET`.
- Public Supabase diagnostics are locked behind `DIAGNOSTICS_SECRET` or `TELEGRAM_SETUP_SECRET`.
- `/api/broke?check=supabase` now checks the auxiliary tables too.
- Community web posting is disabled by default and requires explicit environment opt-in.
- Share image upload validates image type and size.
- Basic security headers were added in `next.config.ts`.

## Required Vercel environment variables after this patch

At minimum for production:

```txt
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=long_random_secret
TELEGRAM_SETUP_SECRET=long_random_secret
WEB_AUTH_SECRET=long_random_secret
CRON_SECRET=long_random_secret
```

Optional:

```txt
DIAGNOSTICS_SECRET=long_random_secret
NOTIFICATIONS_SECRET=long_random_secret
COMMUNITY_WEB_POSTING_ENABLED=false
COMMUNITY_WRITE_SECRET=long_random_secret
```

## Deployment note

After setting or rotating `TELEGRAM_WEBHOOK_SECRET`, run:

```txt
/api/telegram/set-webhook?key=TELEGRAM_SETUP_SECRET_VALUE
```

After this, Telegram will send `x-telegram-bot-api-secret-token`, and `/api/telegram` will reject fake webhook calls.

## Remaining recommendation

`npm audit --omit=dev` reports vulnerabilities through `next@16.2.4`. The audit recommends updating Next.js to `16.2.6`. Do this as a separate dependency-only patch and verify build on Vercel before treating it as stable.
