#!/usr/bin/env bash
set -euo pipefail

# Validates an ephemeral OpenCode-generated Playwright spec before it runs in CI.

SPEC="${1:?Usage: validate-pr-demo-spec.sh <path-to-spec.ts>}"

if [ ! -f "$SPEC" ]; then
  echo "::error::Spec file not found: ${SPEC}"
  exit 1
fi

if ! grep -q 'test(' "$SPEC"; then
  echo "::error::Generated spec is missing a Playwright test()"
  exit 1
fi

if grep -Eq "require\\(['\"]child_process|from ['\"]fs['\"]|from ['\"]node:fs['\"]|from ['\"]node:child_process['\"]|from ['\"]node:net['\"]|from ['\"]node:http['\"]|from ['\"]node:https['\"]|from ['\"]node:dns['\"]" "$SPEC"; then
  echo "::error::Generated spec contains disallowed imports"
  exit 1
fi

if grep -Eo "https?://[^'\"[:space:]]+" "$SPEC" | grep -Ev '^https?://(127\.0\.0\.1|localhost)([:/]|$)' >/dev/null; then
  echo "::error::Generated spec references external URLs"
  exit 1
fi

while IFS= read -r import_line; do
  case "$import_line" in
    *"@playwright/test"*) continue ;;
    *"e2e/helpers/"*) continue ;;
    *)
      echo "::error::Generated spec has disallowed import: ${import_line}"
      exit 1
      ;;
  esac
done < <(grep -E "^import " "$SPEC" || true)

echo "Validated ${SPEC}"
