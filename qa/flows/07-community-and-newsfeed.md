# Flow 07 — Community & newsfeed

- **Personas:** Student (ask/answer), Tutor/Admin (moderate)
- **Features covered (FEATURE_AUDIT §2):** 15 Community Q&A · 16 Course newsfeed · 42 In-app notifications (⚠️ verify NOT shipped)
- **Modes:** both
- **Map refs:** FEATURE_AUDIT §3.12, §7.3

## Preconditions
- A course with an enrolled student and a tutor.

## Happy path
- [ ] **Ask a question.** Student posts a community question on a course → saved + visible. _Ref:_ `routes/community/community.ts`, `schema.ts:1558`.
- [ ] **Answer a question.** Another user answers → answer recorded. _Ref:_ `schema.ts:1522`.
- [ ] **Author/team edit-delete.** Only the author or course team can edit/delete a Q/A. _Ref:_ `question-author-or-team` middleware, §3.12.
- [ ] **Course newsfeed post.** Admin/Tutor posts an announcement → appears in feed. _Ref:_ `routes/course/newsfeed.ts`, `schema.ts:1605`.
- [ ] **Comment on newsfeed.** Add a comment → recorded; author/team can manage. _Ref:_ `schema.ts:1632`, `newsfeed-comment-author-or-team.ts`.
- [ ] **Program newsfeed** (if cohort) posts + comments work. _Ref:_ `program-newsfeed-comment-author-or-team.ts`.

## Edge cases / probes
- [ ] **Non-author/non-team** cannot edit/delete others' content → 403.
- [ ] **Empty / very long** post handling.
- [ ] **⚠️ In-app notifications NOT shipped:** confirm there is **no** in-app notification center exposed (PRD-only). Record result. _Ref:_ audit §7.3.

**Coverage:** features 15, 16, 42(verify-absent).
