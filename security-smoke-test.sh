# v58.18 — Final Security Verification Checklist

This is a checklist pack, not an app patch.

Start with:

```txt
FINAL_SECURITY_VERIFICATION.md
```

Optional no-secret endpoint smoke test:

```bash
bash scripts/security-smoke-test.sh https://YOUR-DOMAIN.vercel.app
```

Supabase post-RLS audit:

```txt
supabase/review/20260520_v58_18_post_rls_audit.sql
```
