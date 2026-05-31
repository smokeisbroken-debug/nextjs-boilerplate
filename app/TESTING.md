# Smoke Is Broke — v59.46.3 Token Data Force Refresh + Cache Clear

v59.46.3 adds explicit cache controls to the first automatic BROKE Leak Research token-data layer. Same-mint cache reuse remains the default, but users can now force a fresh live source request or clear the local token-data cache when they want to re-check a mint without waiting for the 10-minute TTL.

## Patch contents

- Added `Force refresh` to bypass fresh same-mint local cache and request live DEX Screener / Solana RPC data.
- Added `Clear cache` to remove the browser-local token-data cache under `broke-leak-score-token-data-cache-v1`.
- Added visible local cache count in the Basic Token Data header.
- Updated cache messaging so users can distinguish cache reuse, live fetch, force refresh, and cache clear states.
- Kept the 12-second fetch cooldown to reduce repeated source/rate-limit noise.
- Updated shared build marker to `v59.46.3`.

## Files changed

- `app/page.tsx`
- `app/globals.css`
- `app/lib/brokeAdminRewards.ts`
- `app/lib/brokeLeakScoreTokenData.ts`
- `app/api/leak-score/token-data/route.ts`
- root/app docs

## Safety notes

No Supabase persistence, public project database, automated scam detection, project accusation labels, investment advice, payout logic, reward eligibility formula, Daily Routine, Active Streak, wallet verification, Admin distribution API behavior, payout-wallet env names, or server auto-send behavior changed.

## Verification

- `npm run typecheck` passed.
- `npm run lint:quiet` passed.
- `NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully, then timed out during Next.js `Running TypeScript ...` in the sandbox while standalone `npm run typecheck` passed, consistent with the existing large monolithic `page.tsx` build-time issue.
- Targeted brace/paren balance passed for changed files.
- Targeted BigInt literal suffix scan passed.
- Zip integrity passed.

## Manual test checklist

1. Open Pro Mode → Leak.
2. Paste a valid Solana mint.
3. Click `Fetch data` and confirm live data appears.
4. Confirm the UI says the result was cached locally.
5. Click `Fetch data` again for the same mint and confirm cache reuse.
6. Click `Force refresh` and confirm the app requests live source data instead of reusing cache.
7. If clicked too quickly, confirm the 12-second cooldown message appears.
8. Click `Clear cache` and confirm the cache count becomes 0.
9. Click `Fetch data` again and confirm it makes a live source request.
10. Confirm `Apply hints`, `Save PNG`, `Send to TG bot`, and `Copy text` still work.
