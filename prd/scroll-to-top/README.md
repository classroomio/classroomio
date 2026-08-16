# Scroll to Top

## Status

- Draft (spec only; not implemented)

## Purpose

Give learners (and anyone else reading a long page) a single, shared way to jump back to the top after they have scrolled away from it. The control is a floating button in the bottom-right corner. It is **hidden until the page actually overflows and the user has scrolled a meaningful distance**. Clicking it scrolls to the top. That is the entire interaction.

This is a **shared UI convention**, not a per-page invention. Any surface whose main column can grow taller than the viewport must use this component. Do not build a one-off back-to-top button.

## Motivation

Course-taking pages are the longest surfaces in the product:

- Public course **lessons** and **exercises** (`/course/[slug]/lesson/[itemSlug]`) — rich-text bodies, video, questions, then a footer prev/next block.
- Authenticated LMS **content list** (`/courses/[id]/lessons`) — many sections and items; teachers and students both scroll the outline.
- Authenticated LMS **lesson** (`/courses/[id]/lessons/[lessonId]`) and **exercise** (`/courses/[id]/exercises/[exerciseId]`) — same long-read / long-form take experience inside the course shell.

Today there is no way back to the top except manually scrolling. On a phone, after reading a long lesson, that is a lot of work. The same gap will keep appearing on every new long page unless the pattern is a named component plus an `AGENTS.md` rule.

## Confirmed decisions

1. **One shared component** in `@cio/ui` (`packages/ui/src/custom/scroll-to-top`). Dashboard, public course, and Storybook all consume it. Copy is passed in as a `label` prop (UI package stays English-free).
2. **Hidden by default.** The button is not in the visual tree at `scrollTop === 0`, even on a long page.
3. **Appears only when both are true:**
   - The scroll container overflows (content is taller than the viewport / container).
   - The user has scrolled past the **show threshold**.
4. **Show threshold = one viewport height.** `scrollTop >= clientHeight` of the scroll container. See [Threshold recommendation](#threshold-recommendation).
5. **Click does one thing:** smooth-scroll that container to `top: 0`. No hash change, no extra menu, no “scroll to previous section”.
6. **Fixed to the viewport, bottom-right.** Not sticky inside the content column. Hosts that already have bottom chrome (public-course mobile nav, Ask AI bar) pass a clearance so the button sits above that chrome.
7. **Mount in shells for v1**, not on every leaf page. Visibility is still automatic: short pages inside those shells never show the button.
8. **Not a global app layout mount.** Auth screens, short admin lists, and dialogs must not pick it up by accident.

## Threshold recommendation

**Show after one viewport of scroll. Hide again below 0.8 viewports.**

| Option | Show when | Verdict |
| --- | --- | --- |
| 1 viewport (`scrollTop >= clientHeight`) | User has left the first screen | **Choose this.** Device-relative; late enough that a short bump does not flash the button; early enough on a 10-screen lesson. |
| Fixed 400px | Same distance on every device | Reject. ~½ screen on desktop, more than a screen on a short phone. |
| 25–50% of document height | Proportion of *content* | Reject. A long lesson would hide the button until the user is already deep in. |
| Any overflow (show as soon as `scrollTop > 0`) | First pixel of scroll | Reject. Flickers on tiny overscroll / rubber-banding. |

Hysteresis: **show at 1.0 × viewport, hide at 0.8 × viewport**, so sitting on the boundary does not strobe the button.

If the page cannot scroll a full viewport (content is only slightly taller than the window), the button never appears. That matches “only when there is real overflow.”

Constants (implementation must not scatter magic numbers):

```ts
export const SCROLL_TO_TOP_SHOW_RATIO = 1;
export const SCROLL_TO_TOP_HIDE_RATIO = 0.8;
```

Hosts may pass `thresholdPx` only for tests or genuine exceptions. Product default is the ratio above.

## User stories

- **As a learner** on a long public lesson, after I have scrolled past the first screen, I want a button in the bottom-right so I can return to the title / video without dragging back.
- **As a learner** taking an LMS exercise with many questions or sections, I want the same control so I can jump back to the exercise heading.
- **As a teacher or student** on the course contents list with many sections, I want the same control after I have scrolled the outline.
- **As a developer** adding a new long-read page, I want one component and an `AGENTS.md` rule so I do not invent a fourth back-to-top button.

## Feature detail

### Component

**Path:** `packages/ui/src/custom/scroll-to-top/`

**Export:** `ScrollToTop` from `@cio/ui/custom/scroll-to-top` (and re-export from the `@cio/ui` barrel, same as `IconButton`).

**Visual**

- Icon-only circular (or `rounded-full`) control.
- Lucide `ArrowUp` (or `ChevronUp`) icon.
- Built on existing `Button` / `IconButton`: `size="icon"` (or `icon-lg` if tap target feels tight on mobile) and **`variant="secondary"`** — icon-only buttons must use secondary.
- Light shadow so it reads as floating above the page (`ui:shadow-md` or equivalent).
- Fade + short translate on enter/leave. If `prefers-reduced-motion: reduce`, skip the motion and scroll with `behavior: 'instant'`.
- Tooltip / `aria-label` from the `label` prop (required).

**Default placement**

```
viewport
┌─────────────────────────────┐
│                             │
│                             │
│                             │
│                             │
│                      ┌───┐  │  ← ~1.5rem from right and bottom
│                      │ ↑ │  │     (plus safe-area inset)
│                      └───┘  │
└─────────────────────────────┘
```

- `position: fixed`
- `z-index`: `z-30` — above page content and the public-course sticky header (`z-30` tie: later in DOM wins). Below dialogs/sheets (`z-50+`). Public-course mobile `BottomNav` is `z-40`; the button must **clear it spatially**, not compete in z-index (see [Bottom chrome](#bottom-chrome)).
- Default inset: `right: 1.5rem`; `bottom: max(1.5rem, env(safe-area-inset-bottom) + 1rem)`.

**Behavior**

1. Resolve the scroll container: `window` / `document.documentElement` by default, or an element passed as `target`.
2. On scroll (and on resize / content mutation): compute `scrollTop`, `clientHeight`, `scrollHeight`.
3. If `scrollHeight <= clientHeight`, stay hidden.
4. If `scrollTop >= SHOW_RATIO * clientHeight`, show. If `scrollTop < HIDE_RATIO * clientHeight`, hide.
5. On click: `container.scrollTo({ top: 0, behavior })`. Nothing else.
6. On SvelteKit navigation, re-evaluate (new page starts hidden). Do not leak a visible button across routes.

Listen with `<svelte:window onscroll>` / `<svelte:window onresize>` for the document case (do not wrap this in `onMount` + `addEventListener`). For an element `target`, attach `onscroll` to that node. Throttle visual updates with `requestAnimationFrame` if needed; do not put scroll-position writes inside `$effect`.

**Props**

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `label` | `string` | required | Accessible name and tooltip. Dashboard passes `$t('common.scroll_to_top')`. Public course / Storybook pass a literal or translated string from the host. |
| `target` | `HTMLElement \| null` | `null` (window) | Nested overflow container, if the page does not scroll the document. |
| `clearance` | `'default' \| 'mobile-nav' \| 'ask-ai'` | `'default'` | Bottom offset preset for existing chrome. |
| `class` | `string` | — | Escape hatch for one-off offset. Prefer `clearance`. |

Do not add an `open` / `visible` prop for product use. Visibility is derived from scroll. Storybook may use a forced-visible story via a dedicated `forceVisible` prop that is **not** used in app code.

### Bottom chrome

The button must never sit under another fixed footer.

| Surface | Existing chrome | `clearance` |
| --- | --- | --- |
| Public course lesson/exercise, `lg:hidden` | `PublicCourse.BottomNav` (`fixed inset-x-0 bottom-0 z-40`; main already has `pb-24`) | `mobile-nav` → roughly `bottom-24` on small screens, default on `lg+` |
| LMS lesson / exercise | `ContentAskAiBar` is **centered** at `bottom-4` / full-width when expanded | `ask-ai` → lift on small screens so the FAB is not on top of the collapsed Ask AI chip; desktop can stay `bottom-6` because Ask AI is centered and the FAB is right-aligned |
| Course contents list, most other pages | None at the bottom-right | `default` |
| Settings pages with `Page.SettingsActions` | Centered sticky card at `z-50` | `default` (right side is free). Do not cover the card. |

Public-course shell should pass `clearance="mobile-nav"` itself so leaf lesson/exercise views stay unaware of the nav.

### v1 mount points

Mount **once per shell**, not on every page file.

#### 1. Public course shell

`packages/ui/src/custom/public-course/shell.svelte`

Covers:

- Public **lesson** view
- Public **exercise** view

(`apps/dashboard/src/routes/(org-site)/course/[slug]/lesson/[itemSlug]/+page.svelte` already renders inside this shell.)

Window is the scroller (`min-h-dvh`, no overflow trap on `<main>`). Default `target` is correct.

#### 2. Authenticated course layout

`apps/dashboard/src/routes/(app)/courses/[id]/+layout.svelte`

Covers:

- **Contents / lessons list** — `/courses/[id]/lessons` (flat items or grouped **sections**; this is the “sections / contents” page)
- **Lesson** — `/courses/[id]/lessons/[lessonId]`
- **Exercise** — `/courses/[id]/exercises/[exerciseId]`
- Other course tabs that happen to be long (people, newsfeed, analytics) get the same automatic behavior; that is acceptable

The dashboard host supplies the translated `label`. The layout already knows when Ask AI is shown (`showContentAskAiBar`); pass `clearance="ask-ai"` on lesson/exercise routes and `default` otherwise.

Course pages scroll the document today (`Sidebar.Provider` is `max-h-svh` but the inset does not use `overflow-y-auto`). If that ever changes to an inner scroller, pass that element as `target` from the layout — do not fork the component.

### Dashboard copy

Add to `apps/dashboard/src/lib/utils/translations/en.json`:

```json
"common": {
  "scroll_to_top": "Back to top"
}
```

Run `pnpm translate` after adding the English key. Public course shell lives in `@cio/ui` and has no i18n: the org-site layout/page that constructs `PublicCourseShell` must pass the translated label (same pattern as `exploreLabel` / `signInLabel`).

### Storybook

`packages/storybook/src/molecules/scroll-to-top/scroll-to-top.stories.svelte`

Stories:

1. **In overflowing container** — a tall `target` box; scrolling past one container-height reveals the button; click returns to top.
2. **No overflow** — short box; button never appears.
3. **Forced visible** — layout/docs only, so authors can see the default, `mobile-nav`, and `ask-ai` offsets without scrolling.

### Agent / docs updates (this spec’s companion)

Implementation must keep these in sync:

- `AGENTS.md` — “Scroll to top” section (already added with this spec; tighten the import path if it moves).
- `packages/ui/README.md` — component section with props, clearance, and “use on any overflowing main column”.
- `packages/ui/src/index.ts` — barrel export.

## Out of scope (v1)

- Scroll-spy, section dots, or “back to previous heading”.
- Remembering scroll position across lessons.
- Showing the button inside dialogs, sheets, drawers, or nested panes (transcript, comment trees, selects). Those keep their own scroll.
- A global mount on `(app)/+layout.svelte` or `(org-site)/+layout.svelte`.
- Changing `Page.SettingsActions` or Ask AI layout.
- Analytics on click (add later if we care about usage).

## Later / same component, more hosts

Do **not** create a second control. When these pages are long, drop in `ScrollToTop`:

- Public course landing (`/course/[slug]`)
- Org landing / catalog
- LMS community thread
- Course newsfeed (already under the course layout, so v1 may already cover it)
- Long settings forms (button at bottom-right; save bar stays centered)

## Implementation checklist

- [ ] `packages/ui/src/custom/scroll-to-top/` component + constants + `ui:` prefix
- [ ] Storybook stories (overflow, no overflow, clearance variants)
- [ ] `packages/ui/README.md` + barrel export
- [ ] Mount in `PublicCourse.PublicCourseShell` with `clearance="mobile-nav"` and a `label` prop on the shell
- [ ] Mount in `courses/[id]/+layout.svelte` with translated label and Ask AI clearance
- [ ] `common.scroll_to_top` + `pnpm translate`
- [ ] Confirm `AGENTS.md` still matches the real import path
- [ ] Manual pass: public lesson, public exercise, LMS contents list with many sections, LMS lesson, LMS exercise — button hidden at top, visible after ~1 screen, click returns to top, no overlap with BottomNav / Ask AI

## Testing notes

- Public course: `http://localhost:5173/course/<slug>/lesson/<itemSlug>?org=<siteName>` (cloud VM: `?org=udemy-test`).
- LMS: log in (`admin@test.com` / `123456`), open a course → Lessons (contents) → a lesson → an exercise.
- Resize across the `lg` breakpoint on a public lesson: button must clear the mobile bottom nav and sit at the default offset on desktop.
- `prefers-reduced-motion`: no enter animation; scroll is instant.
