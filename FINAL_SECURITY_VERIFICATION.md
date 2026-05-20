# Secret exposure response playbook

Use this if a secret is ever found in GitHub, a screenshot, logs, chat, or a public file.

## 1. Assume exposed secrets are compromised

Do not only delete the file. Rotate the secret.

## 2. Rotate in this order

```txt
1. Supabase service role key
2. Telegram bot token
3. WEB_AUTH_SECRET
4. TELEGRAM_WEBHOOK_SECRET
5. TELEGRAM_SETUP_SECRET
6. CRON_SECRET / NOTIFICATIONS_SECRET
7. COMMUNITY_WRITE_SECRET
```

## 3. Update Vercel

```txt
Vercel → Project → Settings → Environment Variables
Replace secret
Redeploy production
```

## 4. Reset Telegram webhook if needed

After rotating Telegram webhook/setup secrets:

```txt
/api/telegram/set-webhook?key=NEW_TELEGRAM_SETUP_SECRET
```

## 5. Check Supabase logs

Look for unusual reads/writes around the exposure window.

## 6. Remove from Git history if needed

If a real secret was committed, use GitHub guidance or a history rewrite tool. Rotation is still required even if history is cleaned.
