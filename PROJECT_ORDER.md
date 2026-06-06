# Project Order — v59.51.6 Leak Hub Accordion UX Hotfix

## Goal

Fix the Check tab hub interaction based on community feedback. The hub cards should not feel stuck open or force users to leave the section to reset the view.

## Scope

- Base: confirmed working v59.51.5 stable8.
- Patch type: UX-only hotfix.
- Main files: `app/page.tsx`, `app/globals.css`, `app/lib/brokeAdminRewards.ts`, docs.

## Implementation

1. Add local `openHubTool` state inside `UniversalLeakCheckScreen`.
2. Convert Leak Hub direct navigation cards into expandable cards.
3. Add close/open arrow indicator on each card.
4. Move deep-tool navigation into the expanded panel as explicit `Open ...` actions.
5. Keep Universal Check as the default expanded tool and provide a `Paste / focus input` action.

## Guardrails

Do not change token/wallet signal formulas, rewards, Admin payout logic, wallet verification, Supabase schema, transaction-history scanning, PnL, scam labels, investment advice, or bottom-nav structure.
