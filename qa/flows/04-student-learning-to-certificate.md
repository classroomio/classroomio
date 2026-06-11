# Flow 04 — Student learning → certificate

- **Personas:** Student (learner); Tutor (grades)
- **Features covered (FEATURE_AUDIT §2):** 7 Lessons (consume) · 8 Exercises (submit) · 12 Compliance training · 13 Certificates
- **Modes:** cloud + self-host
- **Map refs:** FEATURE_AUDIT §3.7, §3.9, §3.10, §6C

## Preconditions
- A student enrolled in a published course (from Flow 03).
- The course has lessons + at least one exercise (from Flow 02).
- For the compliance/certificate path: a `COMPLIANCE`-type course with a deadline configured.

## Happy path — learning

- [ ] **Open the course as a student.** Enrolled course appears; can open it. _Ref:_ `routes/course/people.ts`.
- [ ] **Read lessons.** Navigate lessons (notes/slides/video play). _Ref:_ `routes/course/lesson.ts`. _Watch for:_ video playback / HLS cross-origin (`app.ts:48-54`).
- [ ] **Mark lesson complete.** Mark a lesson done → completion recorded; progress updates. _Ref:_ `lessonCompletion` `schema.ts:1490`.
- [ ] **Switch lesson language** (if translated) → correct locale content shows. _Ref:_ `schema.ts:1706`.

## Happy path — exercise & grading

- [ ] **Submit an exercise.** Answer questions (incl. video-recording type) → submit → submission recorded. _Ref:_ `routes/course/submission.ts`, `schema.ts:571,617`.
- [ ] **Tutor grades.** As Tutor, open submission → mark/grade → status updates. _Ref:_ `routes/course/mark.ts`.
- [ ] **Student sees result.** Student sees graded status/score.

## Happy path — completion & certificate (compliance)

- [ ] **Complete the course.** Finish lessons + required exercises → completion recorded. _Ref:_ `courseCompletionRecord` `schema.ts:768`.
- [ ] **Certificate issued.** On completion a branded certificate is issued + downloadable. _Ref:_ `packages/certificates/src/render.ts`, `courseCertificateIssue` `schema.ts:850`.
- [ ] **Compliance deadlines.** Deadline/renewal/grace tracked; notification events fire. _Ref:_ `routes/course/compliance.ts`, `routes/internal`, `schema.ts:824`.

## Edge cases / probes

- [ ] **Resubmit after grading** behaves per policy (allowed/blocked).
- [ ] **Partial completion** → no premature certificate.
- [ ] **Renewal / retake interval** re-opens the course at the right time. _Ref:_ §3.9.
- [ ] **Grace period & waiver** behavior (per README 21). _Ref:_ §3.9 edge cases.
- [ ] **Certificate custom ID / template** renders correctly. _Ref:_ §3.10.
- [ ] **Non-enrolled user** cannot access course content → 403.

**Coverage:** features 7(consume), 8(submit), 12, 13.
