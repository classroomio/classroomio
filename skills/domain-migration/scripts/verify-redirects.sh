#!/usr/bin/env bash
# Usage: scripts/verify-redirects.sh seo/redirect-map.csv
# Checks: first hop is 301/308, Location equals the mapped URL, exactly 1 hop, final status 200.
# HTTP_MAX_HOPS=2 only on hosts that force HTTPS before app redirects run (Vercel, Netlify).
set -uo pipefail
MAP="${1:-seo/redirect-map.csv}"
HTTP_MAX_HOPS="${HTTP_MAX_HOPS:-1}"
pass=0; fail=0

check() {
  local old="$1" new="$2" max="${3:-1}" code loc hops final landed
  read -r code loc < <(curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "$old")
  read -r hops final landed < <(curl -sL -o /dev/null -w '%{num_redirects} %{http_code} %{url_effective}\n' "$old")
  if [[ "$code" =~ ^30[18]$ && ( "$loc" == "$new" || "$max" != "1" ) && "$landed" == "$new" && "$hops" -le "$max" && "$final" == "200" ]]; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    echo "FAIL $old  code=$code hops=$hops final=$final"
    echo "     got:      ${landed:-$loc}"
    echo "     expected: $new"
  fi
}

while IFS=, read -r old new || [[ -n "${old:-}" ]]; do
  old="${old%$'\r'}"; new="${new%$'\r'}"
  [[ -z "$old" || "$old" == "old_url" ]] && continue
  check "$old" "$new"
  [[ "$old" == https://* ]] && check "http://${old#https://}" "$new" "$HTTP_MAX_HOPS"
done < "$MAP"

echo "$pass passed, $fail failed"
[[ "$fail" -eq 0 ]]
