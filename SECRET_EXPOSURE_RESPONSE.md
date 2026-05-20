#!/usr/bin/env bash
set -u

BASE_URL="${1:-}"

if [ -z "$BASE_URL" ]; then
  echo "Usage: bash scripts/security-smoke-test.sh https://YOUR-DOMAIN.vercel.app"
  exit 1
fi

BASE_URL="${BASE_URL%/}"

echo "v58.18 public no-secret smoke test"
echo "Base URL: $BASE_URL"
echo ""

check_get() {
  local path="$1"
  local label="$2"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE_URL$path" || true)
  printf "%-45s %s\n" "$label" "$code"
}

check_post_json() {
  local path="$1"
  local label="$2"
  local body="$3"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" \
    -X POST "$BASE_URL$path" \
    -H "Content-Type: application/json" \
    --data "$body" || true)
  printf "%-45s %s\n" "$label" "$code"
}

check_get "/api/telegram/set-webhook" "set-webhook no key"
check_get "/api/telegram/delete-webhook" "delete-webhook no key"
check_get "/api/broke?check=supabase" "supabase diagnostics no key"
check_get "/api/notifications/gentle" "gentle notifications GET no key"
check_post_json "/api/notifications/gentle" "gentle notifications POST no key" "{}"
check_post_json "/api/community" "community POST no secret" '{"text":"v58.18 security smoke test"}'
check_post_json "/api/share-result" "share-result wrong payload" '{"not":"an image"}'

echo ""
echo "Interpretation: protected endpoints should return 401/403, or sometimes 405 for wrong method."
echo "A 200 on set-webhook, delete-webhook, diagnostics, or cron without a secret is a blocker."
