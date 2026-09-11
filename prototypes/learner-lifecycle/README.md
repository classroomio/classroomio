# Learner Lifecycle — Prototype

Clickable UX source of truth for `prd/admin-controls-and-reporting/`.

| File | What it is |
| --- | --- |
| `index.html` | Prototype map — start here |
| `audience.html` | **Interactive.** The full loop over 2,400 synthetic learners |
| `states.html` | The twelve edge states, side by side |
| `import.html` | CSV import: upload → preview → result |
| `app-theme.css` | Shared theme, copied from `prototypes/learning-paths` — mirrors `packages/ui/src/index.css` tokens |
| `lifecycle.css` | Components specific to this prototype; each block names the `@cio/ui` primitive it maps to |
| `proto.js` | Synthetic dataset, filter model, popover/toast behavior |

## Running it

```bash
cd prototypes/learner-lifecycle && python3 -m http.server 8899
# → http://localhost:8899
```

Opening `audience.html` over `file://` works too, apart from browser-extension tooling.

## Why 2,400 rows

The customer has tens of thousands of learners. Over twelve hand-written rows, "Select all N matching",
pagination, preset counts and the 1,000-row queued threshold all look like decoration. Over 2,400 generated
rows they behave — the counts are really computed, archiving 400 people really moves them, and the seat
count really falls.

Data is generated deterministically (seeded PRNG) so screenshots are reproducible: ~26% never logged in,
the rest spread across recency bands, ~5% already deactivated or archived, and a slice of "Invited" members
who have no profile yet and therefore cannot be selected.

## What to review

1. **The view switcher, not a row of chips.** Four saved questions live in one quiet dropdown next to search,
   with counts muted and right-aligned. Selecting one *replaces* filter state rather than merging.
2. **Stale-while-loading.** Rows stay visible and dimmed during a refetch; controls stay clickable.
   Today the real page calls `invalidateAll` and goes dead on every filter change.
3. **Selection survives paging**, and a filter change under a held selection prompts rather than silently clearing.
4. **Archive is offered before delete**, each with a one-line consequence. Delete is disabled until the
   selection is already archived.
5. **The confirmation dialog** shows a real 5-row sample with last-login dates and offers "export this list first".
   That is what catches a mis-set filter before it becomes 3,000 wrong archives.
6. **Two distinct empty states** — over-filtered vs genuinely empty.

## Known prototype-only shortcuts

- Export, file picker and template download fire a toast instead of producing a file.
- Count drift (the `409`) is simulated at random on filter-mode actions so the state is reachable.
- Partial failure is seeded ~25% of the time for the same reason.
- Filter state is held in memory here rather than the query string. **The real implementation must put it in
  the URL** — a hard requirement, not a detail: a filtered view is the link an admin sends for sign-off before
  a bulk removal. See `UX.md` §2.8.
