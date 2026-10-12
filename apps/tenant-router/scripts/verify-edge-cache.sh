#!/bin/sh
# Verifies edge caching on a deployed content zone: the second request for an
# immutable package file must come back with cf-cache-status: HIT.
# Usage: ./verify-edge-cache.sh 'https://<orgKey>.classroomio-content.com/activity/content/<token>/sco.html'
set -eu

if [ "$#" -ne 1 ]; then
  echo "usage: $0 <content-file-url>" >&2
  exit 2
fi

url="$1"

first=$(curl -sS -o /dev/null -D - "$url" | tr -d '\r' | grep -i '^cf-cache-status:' | awk '{print $2}')
curl -sS -o /dev/null "$url" >/dev/null
second=$(curl -sS -o /dev/null -D - "$url" | tr -d '\r' | grep -i '^cf-cache-status:' | awk '{print $2}')

echo "first: ${first:-<absent>} second: ${second:-<absent>}"

case "${second:-}" in
  HIT) echo 'edge cache verified' ;;
  *) echo 'expected cf-cache-status: HIT on the repeat request' >&2; exit 1 ;;
esac
