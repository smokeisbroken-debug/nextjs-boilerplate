# Smoke Is Broke — v59.52.6 Wallet Balance Live Recheck Hotfix

v59.52.6 is a targeted hotfix on top of v59.52.5 stable8. It makes the Profile wallet `$BROKE` balance Recheck action force a live RPC balance fetch instead of being overwritten by older verification-status data. The client now sends no-store balance requests with a timestamp, uses the linked wallet as fallback when the draft input is empty, updates the draft after a successful check, and preserves the freshly fetched live balance while silently syncing verified/watched status.

Changed:
- `app/page.tsx`
- `app/lib/brokeAdminRewards.ts`

Not changed:
- Rewards/Admin payout logic
- Wallet verification signature flow
- Supabase schema
- Universal Check scoring
- Daily Routine rules
- Transaction history, PnL, scam labels, or investment advice

Checks:
- `npm run typecheck`
- `npm run lint:quiet`
- production build attempted separately

