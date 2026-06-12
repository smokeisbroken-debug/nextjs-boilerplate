# Project Order — v59.52.11 Streak Safe Automatic Actions


v59.52.11 is a deploy-safety hotfix for Vercel Hobby plans. It disables the built-in Vercel Cron schedule because Hobby projects cannot run cron every 5 minutes. The reminder endpoint remains available for an external scheduler to call every 5–10 minutes with the existing secret key.

## What changed

- `vercel.json` now contains no active Vercel cron jobs, so Hobby deployments are not blocked by the 5-minute cron schedule.
- Telegram reminder endpoint remains unchanged: `/api/notifications/routine-reminders`.
- External scheduler path remains: `/api/notifications/routine-reminders?key=<CRON_SECRET>`.
- Build marker updated to `v59.52.11`.

## What did not change

- Telegram reminder user settings.
- Wallet balance refresh logic.
- Share-image hardening.
- Daily Routine formula.
- Rewards/Admin payout logic.
- Universal Check scoring.

## Verification

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build
```
