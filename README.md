# v59.10 — Pattern-Based Challenges

Patch-only update based on the current stable v59.9 line.

## User-facing change
The Save tab now includes a **Pattern Challenge Coach** that recommends a challenge from the user's weekly behavior pattern.

Instead of making the user randomly pick a challenge, the app now uses existing weekly pattern data to suggest a focused mission.

Examples:
- Takeout leaks → Takeout control mission
- Coffee leaks → Coffee control mission
- Shopping leaks → Shopping freeze mission
- Subscription pressure → Subscription cleanup mission
- Grey-zone spending → Wallet recovery mission
- Late-night/weekend/payday patterns → timing-aware wallet recovery mission

## Technical notes
- No API changes.
- No Supabase migration.
- No Telegram webhook changes.
- Uses existing Challenge API flow and existing Weekly Behavior Report / Pattern Lab data.
