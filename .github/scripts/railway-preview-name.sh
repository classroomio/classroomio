#!/usr/bin/env bash
# Computes the shared pr-<slug>-<hash> base name for a Railway preview. Sourced by both
# railway-preview.yml and railway-preview-teardown.yml so their name derivation can never
# drift out of sync with each other.

# repo: owner/repo, case-insensitive, may have a trailing ".git" (checkout tolerates both,
# so they can reach here — a full URL can't, checkout already fails on that first).
# branch: case-sensitive, used as-is for the hash (only the display slug is lowercased).
preview_base_name() {
  local repo="$1"
  local branch="$2"
  local repo_norm slug hash

  repo_norm=$(echo "$repo" | tr '[:upper:]' '[:lower:]' | sed -e 's/\.git$//' -e 's#/$##')
  slug=$(echo "$branch" | tr '[:upper:]/_.' '[:lower:]---' | sed 's/[^a-z0-9-]//g' | sed 's/--*/-/g; s/^-//; s/-$//' | cut -c1-18 | sed 's/-$//')
  hash=$(echo -n "${repo_norm}#${branch}" | sha256sum | cut -c1-8)

  echo "pr-${slug}-${hash}"
}
