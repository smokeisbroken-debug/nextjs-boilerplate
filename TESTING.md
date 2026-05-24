# v59.7.4 Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:
1. Open Profile.
2. Change nickname, status line, avatar preset and identity style.
3. Check Public identity preview.
4. Open Home → Share Result.
5. Confirm share card shows the selected identity.
6. Confirm Public Proof Mode still hides private balances.
