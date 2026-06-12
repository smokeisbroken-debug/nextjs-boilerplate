# Project Order — v59.52.13 Distribution Partial Send Audit + Retry Safety

Base: v59.52.12 stable8.

## Scope

Fix partial admin reward distributions so one failed recipient does not hide already-sent payouts behind a generic 500 response.

## Changed files

- `app/api/admin/distributions/route.ts`
- `app/lib/brokeAdminDistributionRoute.ts`
- `app/lib/brokeAdminDistributionStore.ts`
- `app/lib/brokeAdminServerPayout.ts`
- `app/lib/brokeAdminRewards.ts`
- `app/page.tsx`

## Validation

Run:

```bash
npm run typecheck
npm run lint:quiet
npm run build
```
