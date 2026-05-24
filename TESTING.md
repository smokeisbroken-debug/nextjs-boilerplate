# v59.7.2 — Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:

1. Open Profile tab.
2. Confirm Personal Cabinet still appears at the top.
3. Confirm Profile settings hub appears below it.
4. Open Quick Setup and verify language, region, currency mode, life mode and income style still work.
5. Open Money Setup and verify income, payday and fixed costs still update.
6. Open Currency & Repair and verify Display Currency and Old Data Currency Repair still appear.
7. Open Privacy & Public Proof and verify Public Proof and Public Leaderboard toggles work.
8. Open Personalization and verify category rename fields still work.
9. Open Notifications & Sync and verify Daily Reminder and connection details remain accessible.
10. Open Progress Vault and verify streak/badges are visible.
11. Open Data & Records and verify tracked expenses, latest records and Delete My Data remain accessible.
