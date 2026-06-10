# Flow 02 — Course authoring

- **Personas:** Admin / Tutor
- **Features covered (FEATURE_AUDIT §2):** 6 Courses · 7 Lessons & lesson editor · 8 Exercises & questions (authoring) · 37 Unsplash image search
- **Modes:** cloud + self-host (behavior should be identical; spot-check one, smoke the other)
- **Map refs:** FEATURE_AUDIT §3.5, §3.6, §3.7, §6B

## Preconditions
- Logged in as Admin (e.g. seeded `admin@test.com` / `123456`) with an org.
- On the dashboard at `(app)/courses`.

## Happy path

- [ ] **Create a course.** Courses → New course → choose type (`SELF_PACED` / `LIVE_CLASS` / `COMPLIANCE` / `PUBLIC`) → course created. _Ref:_ `routes/course/course.ts`, `schema.ts:634`, type enum `schema.ts:26`. _Watch for:_ the recent `courseNo`/`coursesNo` save mismatch regression (commit `e1e56a70b`) — confirm course saves cleanly.
- [ ] **Add sections.** Add 2–3 sections; reorder them → order persists. _Ref:_ `routes/course/section.ts`.
- [ ] **Add a lesson.** Add a lesson with notes/slides/video → content saves. _Ref:_ `routes/course/lesson.ts`, `schema.ts:956`.
- [ ] **Rich content + Unsplash image.** Insert an image via the Unsplash picker → search works, image inserts. _Ref:_ `routes/unsplash/unsplash.ts` (feature 37). _Watch for:_ empty results, broken thumbnails, attribution.
- [ ] **Add a lesson translation.** Add a second locale for a lesson → translation saved; switching locale shows correct content. _Ref:_ `routes/course/lesson-language.ts`, `schema.ts:1706,1732`, locale enum `schema.ts:27`.
- [ ] **Create an exercise.** Add an exercise to the course → exercise + sections render. _Ref:_ `routes/course/exercise.ts`, `schema.ts:1175,1217`.
- [ ] **Add questions of each type.** Add multiple question types (incl. video-recording type) with answers → saved. _Ref:_ `schema.ts:1803-1913`, `packages/question-types`, PRD `video-recording-question-type [DONE]`.
- [ ] **Edit then re-save.** Edit lesson + exercise content, save again → no data loss, no duplicate rows.
- [ ] **Publish the course.** Publish → course becomes visible on org site / available to enroll. _Ref:_ §6B, §3.19.

## Edge cases / probes

- [ ] **Publish with no sections/lessons** → graceful guard, not a 500. _Watch for:_ server error vs friendly validation.
- [ ] **Course type drives behavior:** `COMPLIANCE` exposes deadline/renewal options; `PUBLIC` exposes public-site options. _Ref:_ `schema.ts:26`.
- [ ] **Multilingual fallback:** lesson with no translation for a locale falls back sensibly. _Ref:_ `schema.ts:1706`.
- [ ] **Concurrent edit / fast double-save** doesn't corrupt content or order.
- [ ] **Large content / paste from Word** renders without breaking the editor (katex, `routes/course/katex.ts`).

**Coverage:** features 6, 7, 8(author), 37.
