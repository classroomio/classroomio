# UI Behavior Spec — Learner Usage & Lifecycle

Companion to `README.md`, which covers data, API, and sequencing. This file covers **what the admin sees and what happens when they click.** Where the two disagree, this file wins on behavior.

Everything here composes existing components (`Page.*`, `Table.*`, `Popover`, `DropdownMenu`, `Dialog`, `Sheet`, `Chip`, `Badge`, `Skeleton`, `Empty`, `TablePagination`, `Search`, `SortPopover`). No new visual language.

---

## 0. Three behaviors that are wrong today and must not be inherited

1. **Filtering blocks and blanks.** Every filter/sort/page change calls `goto(…, { invalidateAll: true })` (`audience.svelte:150`), so the whole route reloads and the table is unresponsive until the server answers. At 20 000 learners with four new joins, that is a visible stall on every click.
2. **`audience-table-skeleton.svelte` exists and is never rendered.** It is exported from the components index and imported nowhere. There is no loading affordance at all.
3. **Selection is wiped by an `$effect` on the data** (`audience.svelte:38`). Any refetch — including one caused by changing a filter — silently clears the admin's selection with no notice.

All three are load-bearing for a bulk-action workflow. §2 and §4 specify the replacements.

---

## 1. Page anatomy

```
Page.Header
  Title "Audience"                                          [Export ▾] [Import]
  Subtitle "Everyone with learner access. · 11,930 of 12,500 seats"

Page.BodyHeader
  ── Control row ───────────────────────────────────────────────────────
  [ Search…          ]  All learners ⌄   [ ⚙ Filter • ]  [ ↕ Sort ]
                              │
                              └─ All learners      12,480  ✓
                                 Never logged in    3,214
                                 Inactive 90+       5,102
                                 Inactive 180+      2,884
                                 Enrolled, not started 941

  ── Active-filter chips (only when filters are set) ───────────────────
  Last login: before 90 days ×   Status: Active ×        Clear all

Page.Body
  Result summary:  "3,214 learners · sorted by last login, oldest first"
  Table (8 columns, horizontally scrollable)
  TablePagination
```

When rows are selected, the **control row is replaced in place** by the bulk bar (§4.2).

**The control row is right-aligned**, matching `Page.BodyHeader`'s own `align="right"` default and the
existing courses and cohorts toolbars. Today `audience-table-toolbar.svelte` overrides this with a
`md:justify-between` wrapper that pushes search left and sort right — it is the outlier in the app, and this
work should drop the override and use the component default. Search keeps `@cio/ui` `Search`'s natural
`ui:w-fit ui:max-w-[200px]`; it does not stretch. The active-filter chips row sits right-aligned too, directly
under the Filter trigger it came from, so the two read as one cluster. Below `sm` both stack full-width.

**Seat usage lives in the subtitle, as muted text** — `· 11,930 of 12,500 seats` — not as a coloured badge
beside the title. It is reference information the admin glances at, not an alarm. It earns its place because
archiving makes it fall (README Finding 1), which is how the admin sees the loop paying off.

---

## 2. Filtering

### 2.1 The view switcher — the primary control

Four saved questions cover almost every session. They belong in **one quiet control**, not a row of chips
across the page: a row of coloured preset buttons with count badges shouts at the admin every time they
open the page, and the page should be calm until they ask it something.

- A ghost `Button` sitting immediately left of Filter, labelled with the **current view** — `All learners ⌄`,
  `Never logged in ⌄`. The label is the state; there is no separate active indicator to read.
- Opens a `DropdownMenu` listing: **All learners · Never logged in · Inactive 90+ days · Inactive 180+ days ·
  Enrolled, never started**. Counts sit **muted and right-aligned inside the menu**, where they are available
  on demand and silent otherwise. A check marks the current view.
- Counts come from one `GET /organization/audience/view-counts` call, rendered as `·` until they resolve so
  the menu never reflows.
- Selecting a view **replaces** the entire filter state; it does not merge. Views are starting points, and
  merging them with stale filters produces results nobody can explain. Search is preserved.
- Selecting the **current** view is a no-op, not a toggle-off. "All learners" is how you clear.
- Editing a filter by hand switches the label to **Custom filter**. No view silently claims a state it does
  not describe.
- Counts refresh after any bulk action — watching the dormant number fall is the point.

### 2.2 Filter popover

- Trigger: outline `Button`, `FilterIcon`, label "Filter", with a dot indicator when any filter is active and a count badge when more than one is.
- **Below `md`, the popover becomes a `Sheet`** anchored to the bottom. A five-section filter form in a 360px popover on a phone is unusable.
- Sections, each a `Field.Set` with a `Field.Legend`:
  - **Last login** — `RadioGroup`: Any · Never · Before 30 days · Before 90 days · Before 180 days
  - **Last activity** — same options
  - **Enrollment** — `RadioGroup`: Any · Enrolled · Not enrolled
  - **Completion** — `RadioGroup`: Any · Not started · In progress · Completed
  - **Member status** — `Checkbox` group: Active · Deactivated · Archived (Active pre-checked)
- **Apply semantics: explicit, not live.** The popover holds draft state and commits on a footer **Apply** button. Live-applying each radio fires a full server round trip per click and, with five sections, means up to five stalls to express one intent. The footer also carries **Clear all**, disabled when nothing is set.
- Escape or clicking outside discards the draft. The draft resets on close via `onOpenChange` — never in an `$effect` keyed to `!open`.
- Copy is phrased as staleness, matching how the admin thinks: "hasn't logged in for 90+ days", not "logged in within 90 days".

### 2.3 Active-filter chips

- One `Chip` per active filter, reading as a full clause — `Last login: before 90 days`, not `90d`.
- Each has an × that removes **only** that filter and reapplies immediately (a single removal is one intent, so no Apply step).
- A **Clear all** link ends the row.
- The row is absent, not empty, when no filters are set — no reserved blank space.

### 2.4 Loading — stale-while-loading, never blank

Replaces the blocking `invalidateAll` behavior:

- On any filter/sort/page/search change, **the current rows stay on screen** at `opacity-60` with `pointer-events-none`, and an indeterminate progress bar appears under the toolbar.
- Controls stay interactive throughout, so the admin can correct a mis-click without waiting.
- Only a **cold load with no rows to show** renders `AudienceTableSkeleton` (which finally gets used).
- Requests are cancelled on supersede — `org.svelte.ts` already has `cancelAudienceRequest()` and an `AbortController` for exactly this.
- If a request fails, keep the stale rows, surface an error snackbar, and leave the filters as the admin set them. Never silently revert to unfiltered.

### 2.5 Search

- Keeps the existing 300 ms debounce and the `keepFocus: true` navigation, both of which are already right.
- Search composes with filters (AND), and it does **not** switch the view away — searching within "Inactive 90+" is a normal thing to want.
- The clear × resets search only, leaving filters alone.

### 2.6 Sorting

- Column headers for Name, Email, Joined, Last login, Last activity are clickable, showing an arrow on the active column. `SortPopover` stays for parity and for small screens.
- Clicking an already-active column flips direction.
- **Last login and last activity default to oldest-first**, because "who is most dormant" is the question being asked. Every other column defaults to descending.

### 2.7 Result summary and empty states

- Above the table: `"3,214 learners · sorted by last login, oldest first"`, in an `aria-live="polite"` region so screen readers hear the count change after a filter.
- **No members at all** — existing `Empty` with `audience.no_audience`, plus the Import action.
- **Filters match nothing** — a distinct `Empty`: "No learners match these filters", with **Clear filters** as the primary action. Never show the "invite your first learner" state to someone who just over-filtered.
- **A view with a zero count** stays selectable and lands on the empty state; disabling it hides the good news that the number is zero.

### 2.8 URL and history — required, not optional

**All view state lives in the query string.** Every view, filter, sort key, sort order, search term and page
number is a URL parameter, and the URL is the single source of truth: the page renders from it, and changing
a control means navigating, never mutating local state and refetching behind the URL's back. There is no
second copy of this state in a component.

This is not a nicety for this customer — it is what makes the workflow work:

- **A view is shareable.** "Here are the 3,214 dormant learners" is a link an admin sends to their manager
  for sign-off before a bulk removal. Without it, the reviewer has to be told which five controls to set.
- **Back and forward move between filter states**, not out of the page. An admin who over-filters presses
  back, rather than rebuilding the filter by hand.
- **A refresh preserves everything**, including after the session times out and they sign back in.
- **A bulk action can be re-entered.** The confirmation dialog records the filter it acted on; that filter is
  a URL, so "what exactly did I archive last Tuesday?" is answerable from the audit row.
- **Support and bug reports carry the URL**, so a report is reproducible without a screenshot.

Mechanics:

- Serialise and parse in `audience-query-utils.ts` — extend the existing
  `getAudienceQueryFromSearchParams` / `getAudienceSearchParams` pair rather than adding a parallel scheme.
- Omit defaults from the URL so a plain `/audience` stays clean; parsing fills them in.
- Unknown or malformed parameters fall back to their default instead of erroring — a hand-edited or truncated
  link must still load.
- View changes and filter Apply use `pushState` (they are navigations the admin may want to undo). Typing in
  search uses `replaceState`, so back does not walk through every keystroke. Pagination uses `pushState`.
- **Selection is deliberately not in the URL.** A shared link carries a view, never someone else's pending
  destructive selection.

---

## 3. The table

- Columns: ☐ · Name · Email · Status · Joined · **Last login** · **Last activity** · **Enrollment** · **Progress**.
- The wrapper scrolls horizontally (`overflow-x-auto`); the page body never does. Name column is `sticky left-0` with the header background, matching the existing pattern in `features/course/components/analytics/student-table.svelte:67`.
- **Last login / Last activity** render as relative time ("3 months ago", "Never") with the absolute timestamp in a `title` / `Tooltip`. Relative answers the question at a glance; absolute is there when someone needs to quote it.
- "Never" renders `ui:text-muted-foreground` rather than as a warning colour — it is a fact, and colouring thousands of rows red is noise.
- **Enrollment** is `3 / 5` (completed / enrolled); `—` when not enrolled.
- **Progress** uses `@cio/ui/custom/percent-ring-progress`, with the percentage as accessible text beside it — never colour or shape alone.
- Non-`ACTIVE` rows render at reduced emphasis with a status `Badge` (`Deactivated`, `Archived`).
- Row click behavior is unchanged: the name is a link to the per-learner page. The checkbox and the row-actions menu stop propagation, as they already do.

---

## 4. Selection and bulk actions

### 4.1 Selection

- Per-row `Checkbox`; header checkbox is tri-state for the current page (already implemented).
- Rows without a `profileId` (invited, never signed up) have a **disabled** checkbox with a tooltip explaining why — the current code disables it silently, which reads as a bug.
- **Selection survives paging within an unchanged filter.** Replaces the current `$effect` that clears on every data change. If the admin changes a filter or search while holding a selection, show a one-line notice — "Filters changed. 42 selected learners are no longer shown. [Keep] [Clear]" — rather than dropping it silently.
- Selection state is per-session and not encoded in the URL; sharing a link shares a view, not a selection.

### 4.2 The bulk bar

Appears in place of the control row the moment `selectedCount > 0`, using the same bordered container the current selection bar uses:

```
☑ 42 selected   Select all 3,214 matching       [Assign courses] [Actions ▾]   ×
```

- **"Select all N matching"** appears only when every row on the page is selected, and it is the piece that makes this usable at scale. Clicking it switches to filter mode and the bar restates itself: `All 3,214 learners matching these filters are selected  ·  Clear selection`.
- In filter mode, individual checkboxes deselect back into id mode with a confirmation-free downgrade — the count updates and the banner disappears.
- The × clears selection and restores the control row.
- **Actions ▾** ordering, with Archive first and visually emphasised:
  - **Archive** — "Frees a seat · reversible"
  - **Deactivate** — "Blocks access · keeps the seat · reversible"
  - separator
  - **Delete permanently** — destructive styling (`ui:text-destructive focus:ui:text-destructive`), disabled with an explanatory tooltip unless every selected member is already `ARCHIVED`
  - Contextual `Reactivate` / `Unarchive` appear when the selection contains such members.
- The one-line descriptions are the difference between an admin archiving and an admin deleting. They belong in the menu, not in a help doc.

### 4.3 Confirmation dialog

Anatomy, in order:

1. Title stating the action and the exact count — "Archive 3,214 learners?"
2. One sentence on consequence, per action. Archive: "They lose access and stop counting toward your plan limit. You can restore them at any time."
3. **Sample list** — the first 5 affected learners with name and last login, plus "and 3,209 more". This is what catches a mis-set filter before it becomes an incident.
4. **Filter summary**, when in filter mode — the plain-English clause list, so the admin re-reads what they are acting on.
5. **"Export this list first"** — a secondary link that downloads the full affected set as CSV without closing the dialog. Marked done with a check once used. This is the sign-off step.
6. **Reason** — optional `TextareaField`, stored on the audit rows.
7. Type-to-confirm — **delete only**: type the count to enable the button. Archive and deactivate are reversible and do not need friction that trains people to type past warnings.
8. Buttons: Cancel (secondary) and the action (destructive variant for delete). The action button is disabled while the count is being re-verified.

Dialog state resets in `onOpenChange`. Focus lands on Cancel, not the action.

### 4.4 Executing

**Under ~1 000 rows** — synchronous. Action button shows a spinner; dialog stays open and blocks; closes on success.

**Over ~1 000 rows** — queued. The dialog closes immediately and a persistent bar appears under the header: `Archiving 3,214 learners… 1,240 done` with a determinate `Progress`. The admin can navigate away and come back; the bar is driven by job status, not page state. On completion it becomes a dismissible success summary and the list refreshes.

**Count drift** — if the live count no longer matches what was shown (`409`), do not act. Reopen the dialog with the new count and a short note: "This list changed while you were reviewing it — 3,209 learners now match." Re-confirm from there.

### 4.5 Results

- **Full success, reversible action** — snackbar with **Undo**, live for 10 seconds, that calls the inverse action on the same ids. Archive and deactivate only.
- **Full success, delete** — plain confirmation snackbar. No undo, and the dialog said so.
- **Partial failure** — a summary `Dialog`, not a snackbar: "3,180 archived · 34 failed", a scrollable table of failures with reasons, and **Download failures as CSV**. A snackbar cannot carry 34 rows of detail.
- After any action the list refetches, preset counts refresh, and selection clears. Because the default view filters to `ACTIVE`, archived rows leave the list — the result snackbar names how many, so their disappearance is explained rather than startling.

---

## 5. Export

- `ExportMenu` sits in `Page.Action`: outline `Button`, `DownloadIcon`, label "Export", opening a `DropdownMenu`.
- Items are **scoped and labelled with counts**, so it is never ambiguous what is being exported:
  - `Export 42 selected (CSV)` — only when a selection exists
  - `Export 3,214 filtered (CSV)` — when filters are active
  - `Export all 12,480 (CSV)`
  - `Export as PDF` — **disabled above ~2 000 rows**, with a tooltip: "PDF is available for up to 2,000 rows. Use CSV for larger exports."
- CSV downloads stream, so on large exports the browser shows its own progress. The button enters a loading state until the response starts, then returns to normal — do not fake a progress bar over a browser download.
- Filenames encode the scope: `acme-audience-inactive-90d-2026-09-06.csv`.
- On failure, an error snackbar with a retry action. A failed download is otherwise invisible.

---

## 6. Import

Three steps in one route, with a `Page.Title` that names the step.

1. **Upload** — `FileDropZone` accepting `.csv`, with the paste box below under a "or paste emails" divider. A **Download template** link sits beside the drop zone. Rejected files (wrong type, over 5 MB) explain which rule they broke.
2. **Preview** — three counts as tiles (Ready · Already in audience · Invalid) above a `Table` with a status column. Invalid rows carry the specific reason ("not a valid email address", "duplicate in file"). Continue is disabled when Ready is 0. If the import would exceed the plan limit, a warning banner states how many will be skipped and why, before submitting rather than after.
3. **Result** — the same three counts as outcomes, plus **Download error rows** so the admin can fix and re-upload. Primary action returns to the audience list.

Course and cohort assignment moves into the Preview step, grouped in `Field.Set`s — it is a decision about the import, and asking for it before the file is validated wastes the admin's time.

---

## 7. Accessibility and input

- The result summary and view counts sit in `aria-live="polite"` regions; the bulk bar's selected count is `aria-live` too, so selection changes are announced.
- Every checkbox has an accessible label naming its row ("Select Jane Doe"), not a bare "Select".
- Dialogs trap focus, restore it to the trigger on close, and put initial focus on the safe option.
- The progress bar for queued actions exposes `aria-valuenow`; the queued state is also announced once on start and once on completion, not on every tick.
- Status is never conveyed by colour alone — badges carry text, progress rings carry a percentage.
- Keyboard: `Esc` closes popover/sheet/dialog discarding drafts; the table is fully tabbable; `Space` toggles the focused row checkbox.
- Respect `prefers-reduced-motion` on the bulk-bar transition and the row dimming — swap the fade for an instant state change.
- Touch targets on the view switcher, its menu rows, and the chips meet 44 px on mobile.

---

## 8. Prototype

**Built: `prototypes/learner-lifecycle/`** — this is now the UX source of truth. Where this file and the
prototype disagree, the prototype wins; update this file to match.

- `audience.html` — the whole loop, live over 2,400 synthetic learners. Filters, paging, view counts and
  select-all-matching are really computed, so the scale behaviors are reviewable rather than described.
- `states.html` — the twelve states that are hard to reach by clicking.
- `import.html` — upload → preview → result.

Run it with `cd prototypes/learner-lifecycle && python3 -m http.server 8899`.
Design review happens there, before any Svelte is written.
