# Testing — v59.52.13 Distribution Partial Send Audit + Retry Safety

## Admin distribution regression

1. Load eligible holders.
2. Prepare a real distribution.
3. Run server auto-send.
4. Confirm the UI shows sent/total and failed count if any recipient fails.
5. Confirm the endpoint does not return a generic 500 after partial sends.
6. Confirm already-sent recipients are not retried.

## Commands

```bash
npm run typecheck
npm run lint:quiet
npm run build
```
