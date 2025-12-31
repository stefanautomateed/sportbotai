#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"

echo "Checking environment file: $ENV_FILE"
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found. Copy .env.example to .env.local and fill required values." >&2
  exit 2
fi

required=(STRIPE_SECRET_KEY NEXT_PUBLIC_BASE_URL)
missing=()
for v in "${required[@]}"; do
  if ! grep -q "^${v}=" "$ENV_FILE" || grep -q "^${v}=[[:space:]]*$" "$ENV_FILE"; then
    missing+=("$v")
  fi
done

if [ ${#missing[@]} -ne 0 ]; then
  echo "Missing or empty variables in .env.local: ${missing[*]}" >&2
  exit 3
fi

echo "Basic env check passed. You may still need to set optional keys (ODDS_API_KEY, OPENAI_API_KEY, etc.)."
