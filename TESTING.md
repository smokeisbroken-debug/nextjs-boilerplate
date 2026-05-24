# v59.13 Testing

Run locally:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual tests:

1. Run `supabase/migrations/20260524_v59_13_custom_avatar_storage_bucket.sql`.
2. Open Profile → Wallet & $BROKE balance.
3. Check wallet balance.
4. If balance is below 500K BROKE, custom avatar block must stay locked.
5. If balance is 500K+ BROKE, upload a PNG/JPG/WebP image under 2 MB.
6. Confirm avatar appears in:
   - Personal Cabinet
   - Public identity preview
   - Share Result
   - Safe Weekly Share Card
7. Click `Use preset instead` and confirm preset avatar returns.
8. Try unsupported file type and file over 2 MB; upload should fail.
