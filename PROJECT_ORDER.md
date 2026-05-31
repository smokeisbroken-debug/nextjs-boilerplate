# Smoke Is Broke — v59.50.3 Leak Hub Navigation Cleanup

v59.50.3 keeps the automatic leak-check product direction and fixes the overloaded Pro bottom navigation. The manual Project Research, Wallet Review, and Project vs Project tools are no longer separate bottom-nav buttons; they now live under the main Check tab as a compact Leak Hub.

## Changed

- Bottom navigation is cleaner in Pro Mode by removing Project, Wallet, and Vs from the visible bottom bar.
- The Check tab now acts as the single Leak Hub for:
  - Universal Check
  - Project Research
  - Wallet Review
  - Project vs Project
- When a user opens Project Research, Wallet Review, or Compare from the Check tab, the bottom nav keeps Check highlighted so those screens feel like one section.
- Added a compact Leak Hub card above the Universal Check input so users can reach deeper leak tools without adding more bottom buttons.
- Reduced Pro bottom-nav width and restored more readable icons/labels on mobile after removing the three extra buttons.
- Updated shared build marker to `v59.50.3`.

## Not changed

- No new leak scoring formula.
- No token auto-signal logic change.
- No wallet auto-signal logic change.
- No transaction-history scan, PnL, buy/sell timing, wallet accusation, or scam label.
- No rewards, payout, admin distribution, streak, Daily Routine, wallet verification, Supabase, or server auto-send behavior change.

## Verify

1. Open Pro Mode.
2. Confirm bottom nav no longer shows separate Project / Wallet / Vs buttons.
3. Open Check.
4. Confirm the Leak Hub card shows Universal Check, Project Research, Wallet Review, and Project vs Project.
5. Tap Project Research, Wallet Review, and Compare from the Check tab.
6. Confirm each screen opens and the bottom nav still highlights Check.
7. Paste a token mint or wallet address into Universal Check and confirm results still work.
