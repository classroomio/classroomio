# Lesson preview

## Status

- Draft (prototyped, not scheduled for engineering)

## Prototypes — the UX source of truth

Interactive HTML lives in [`prototypes/lesson-preview/`](../../prototypes/lesson-preview/). When this document and a prototype disagree on a UI detail, the prototype wins.

```
prototypes/lesson-preview/index.html
```

| Surface | Persona | File |
| --- | --- | --- |
| Public course learning page (hero player + curriculum) | Unenrolled visitor | `course-landing.html` |
| LMS Explore enroll modal | Signed-in, not enrolled | `explore.html` |
| Course contents: preview + hero flags | Teacher | `admin-lessons.html` |
| Landing-page editor: hero lesson picker | Teacher | `admin-landing.html` |

## Purpose

Let a visitor **try a course before enrolling or paying** by opening lessons the teacher has marked as preview. The same playlist plays in the course-page hero and in a wider Explore modal. After the free lessons, the prompt matches the course cost: enroll, buy, or “not accepting.”

## Problem

- Course landing heroes are cover images. `course.metadata.videoUrl` exists in the landing editor and is never rendered by the themed course pages.
- Explore’s enroll modal (`course-preview-modal.svelte`) is `sm:max-w-lg` with a static banner. There is no way to watch a lesson from it.
- Curriculum rows on the public course page are titles and durations only. Nothing is playable without enrolling.
- `lesson.isUnlocked` is enrolled pacing (and public-course lock/callout). It is the wrong flag for “unenrolled visitors may see this.”

## Proposed decisions

These are brainstorm defaults, not shipped commitments. Flag anything that should change before implementation.

1. **New `isPreview` boolean on `lesson`.** Default `false`. Independent of `isUnlocked`. Preview = unenrolled visitors. Unlock = enrolled progression (and public-course lock).
2. **One hero lesson per course**, stored as `course.metadata.heroLessonId` (or a dedicated column). Must be a preview lesson. If it has a video, that video is what the hero player starts on. If unset, the first preview lesson with a video is used; if none, the hero stays a cover image.
3. **Retire the unused YouTube URL as the hero.** The landing editor’s short-video field does not play on themed course pages. The hero is a real lesson so landing, curriculum, and Explore share one playlist.
4. **Preview is the full lesson body** — videos, rich text, images — not a clipped trailer. Teachers who want a short trailer create a short lesson and mark that as preview (and optionally as hero).
5. **Exercises are not previewable in v1.** Curriculum can still show they exist; opening one from an unenrolled surface hits the enroll/buy prompt.
6. **Anonymous and signed-in-unenrolled see the same previews.** No progress is written until the learner is enrolled.
7. **CTA copy follows cost and self-enrollment**, and is translated in the academy language:
   - free + self-enroll → Enroll for free / Enroll to continue
   - paid + self-enroll → Buy · {price} / Buy to continue
   - self-enroll off → Not accepting enrollments
8. **One player, two mounts.** Landing: in-page, sticky beside the hero copy, playlist card beneath the stage. Explore: same player inside a **wider** dialog (`sm:max-w-4xl` / `sm:max-w-5xl` when the course has at least one preview; today’s `sm:max-w-lg` when it does not).
9. **Playlist card copy is remaining-count**, e.g. “3 more lessons to preview”, not a static “preview lessons” heading alone.
10. **Curriculum Preview rows are buttons.** Clicking a preview lesson selects it in the player and scrolls to the hero. Clicking a locked row opens the enroll/buy overlay on the player.
11. **Moving between previews is in-player prev/next** plus the playlist cards. Next on the last preview opens the enroll/buy overlay.
12. **HLS for uploaded preview videos** needs an unenrolled playback path (sibling of the public-course HLS cookie), authorized on `lesson.isPreview` + published course, not on enrollment.
13. **v1 course types:** `SELF_PACED` and `LIVE_CLASS` (preview = recordings / notes, not the live session). `COMPLIANCE` stays fully gated. `PUBLIC` already exposes unlocked items; do not double-model it.

## Current-state audit

| Capability | State | Where it lives |
| --- | --- | --- |
| Course landing themes | ✅ | `packages/ui/src/custom/org-landing-page/*/course.svelte` — hero is heading + optional `hero.image` (course logo) |
| Landing editor short video | ⚠️ | `header-form.svelte` writes `metadata.videoUrl`; themed pages never play it |
| Curriculum on landing | ⚠️ | `course-curriculum.svelte` — title, duration, no actions |
| Explore enroll modal | ⚠️ | `course-preview-modal.svelte` — banner, description, price, enroll; `sm:max-w-lg` |
| Lesson lock | ✅ | `lesson.isUnlocked` — enrolled sequential / public-course callout |
| Lesson videos + notes | ✅ | `lesson.videos`, `lesson.note` |
| Public-course anonymous HLS | ⚠️ | Cookie keyed to a public lesson slug, not to “this lesson is a preview on a paid course” |
| Org / academy locale | ✅ | Dashboard translations; landing labels already accept `CourseLandingPageLabels` |

## Surfaces

### Public course landing (`course-landing.html`)

- Hero is two columns on desktop: copy + enroll CTA on the left, player on the right (sticky). Playlist card sits under the stage: remaining count, selectable preview cards (video / article / diagram), enroll/buy strip.
- Toggle **academy language** in the prototype (EN/FR) to show that visitor chrome is not hardcoded English.
- Toggle **free / paid** to swap CTA verbs.
- Curriculum: Preview pill on open rows, lock icon on the rest.

### Explore modal (`explore.html`)

- Course **with** previews: dialog becomes wide. Player replaces the banner. Playlist and remaining-count live under the stage. Footer still has price + enroll/buy.
- Course **without** previews: keep today’s compact banner modal so Explore does not grow for courses that have nothing to play.

### Teacher (`admin-lessons.html`, `admin-landing.html`)

- Contents list: Preview badge, Hero badge. Selecting a row opens Allow preview + Use as hero video. Hero requires preview **and** a video.
- Landing editor: radio list of preview lessons (plus “cover image only”). Cover image remains the card thumbnail and the hero fallback.

## Non-goals (v1)

- Previewing exercises, documents-as-downloads, or live Zoom sessions.
- Saving watch position for unenrolled visitors.
- Time-limited or percentage-clipped trailers.
- A separate “trailer” asset that is not a lesson.
- Per-theme custom player chrome (one player, `--landing-*` / app tokens).
- Changing public-course `isUnlocked` semantics.

## Open questions

1. Cap on preview lessons per course (prototype uses 4)? Soft warning vs hard max?
2. If the hero lesson is unpublished or preview is turned off, auto-fall back to the next preview video or to the cover?
3. Should a preview lesson still respect `isUnlocked === false` for enrolled students, or does preview imply unlocked once they enroll?
4. Deep link `/course/[slug]?preview=[lessonId]` for sharing a specific preview?

## Implementation sketch (when we build)

- Schema: `lesson.is_preview boolean default false`; `course.metadata.heroLessonId`. One migration.
- Org-site course payload includes preview lesson bodies (video, note) for flagged lessons only.
- Shared UI: preview player in `@cio/ui` (or dashboard feature) used by course landing + Explore modal.
- Translations: all visitor strings in `en.json` and academy locales; landing labels via `CourseLandingPageLabels`.
- Explore modal: widen `Dialog.Content` when `previewLessons.length > 0`.
- Do not reuse `isUnlocked` for this.
