# v59.55.0 — Mascot Activity Logic Hardening

## Goal

Make Mascot Progression harder to inflate with weak signals and better tied to real app activity.

## Changes

- Mascot power now includes Challenge History.
- Completed challenges contribute controlled Challenge Energy.
- Active challenges give a small temporary boost.
- Missed challenges reduce Challenge Energy slightly.
- Tracking Energy now uses recent real tracking days instead of raw expense count.
- Clean Day proof can count as today activity when true.
- Mascot UI shows Challenge Energy and completed challenge proof.
- Boost Plan adds a Challenge History item.
- Mascot share text/card includes completed challenge proof.

## Safety

No changes to:

- rewards/admin payout
- wallet verification
- Supabase schema
- Universal Check scoring
- Daily Routine formula
- transaction history / PnL / scam labels
- game mode

This remains a progression layer only.
