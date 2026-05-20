# v58.18 testing notes

This pack does not change app code. Testing is manual and should be done against production after v58.16 and v58.17 are applied.

## Minimum required checks

```txt
1. /api/telegram/set-webhook without key is blocked
2. /api/telegram/delete-webhook without key is blocked
3. /api/broke?check=supabase without key is blocked
4. notification cron without secret is blocked or method-limited
5. Supabase audit shows RLS enabled + forced on existing BROKE tables
6. anon/authenticated have no direct grants on BROKE tables
7. service_role still has needed access
8. app can save a Track Leak entry
9. Telegram Mini App opens and loads user data
10. share cards still work
```

## Suggested local command

```bash
bash scripts/security-smoke-test.sh https://YOUR-DOMAIN.vercel.app
```

This script only checks no-secret public endpoint responses. It does not verify Supabase, GitHub, Vercel, or Telegram auth by itself.
