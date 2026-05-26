# PROJECT ORDER — v59.24.3

1. Keep v59.24.2 as the base.
2. Apply this patch over the project root.
3. Deploy after checks pass.
4. Verify the Rewards tab visually on mobile.

## Scope

This is a UI/copy/state hotfix for the Rewards tab only.

## Main intent

Rewards should feel like the same bright premium app style as Home, Chart, Growth, and Profile. It should not look darker or heavier than the rest of the app.

## State fix

Cloud app-state sync must not overwrite notification preferences with defaults when the cloud payload has no `rewardNotificationPrefs` field.
