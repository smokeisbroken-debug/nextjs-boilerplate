# Smoke Is Broke — v59.52.14 Distribution Failed Status Constraint Hotfix

v59.52.14 is a targeted admin reward distribution hotfix on top of v59.52.14 stable8.

## Changes

- Server payout auto-send no longer fails the whole distribution when one recipient or transaction chunk fails.
- Each recipient is handled with per-recipient sent/failed status in the API response.
- Partial sends return a successful response with sent/failed counts instead of a generic 500 after already sending some payouts.
- Failed rows now stay `prepared` instead of using the unsupported `send_failed` status, so existing Supabase check constraints are respected and failed rows remain retryable.
- One-click distribution UI now shows partial-send copy: sent count, total count, failed count.

## Not changed

- Rewards eligibility formula.
- Admin payout amount calculation.
- Wallet verification.
- Supabase schema.
- Universal Check.
- Daily Routine.
- Transaction history/PnL/scam labels.
