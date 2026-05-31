# Smoke Is Broke — v59.50.5 Auto Result Summary + Share Card

v59.50.5 finishes the Universal Check user-flow layer without adding another manual loop. After a token/wallet/URL check, the result now starts with a short auto summary and includes a local PNG share-card preview/export for X or Telegram.

## What changed

- Added `buildUniversalLeakCheckAutoSummary()` for one clear user-facing result summary:
  - result label,
  - headline,
  - main leak,
  - meaning,
  - next step,
  - top signals.
- Reworked Universal Check copy text into a shorter X/TG-ready note:
  - result,
  - pressure,
  - main leak,
  - meaning,
  - next step,
  - top signals,
  - safe DYOR disclaimer.
- Added an `Auto result summary` card at the top of Universal Check results.
- Added a Universal Check public share card:
  - `$BROKE LEAK CHECK` header,
  - token/wallet type,
  - short address,
  - source confidence,
  - leak pressure,
  - main leak,
  - plain-language meaning,
  - top signals,
  - DYOR / not financial advice footer.
- Added `Share card` and `Save PNG` actions for Universal Check results using the existing local html2canvas export flow.
- Updated shared build marker to `v59.50.5`.

## What did not change

- No rewards changes.
- No Admin distribution changes.
- No payout logic changes.
- No Daily Routine / Active Streak changes.
- No wallet verification changes.
- No Supabase schema changes.
- No transaction-history scan.
- No PnL analysis.
- No scam labels.
- No project accusations.
- No investment advice.
- No token/wallet auto-signal formula change beyond the new summary/share presentation layer.

## Product rule

The main product direction remains:

```txt
Open app → Check → paste token / wallet / URL → get clear result → share card/copy text
```

The wording remains safe: leak signals, research context, educational, not scam detection, not financial advice.
