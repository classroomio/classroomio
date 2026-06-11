# Flow 06 — Programs (cohorts) & attendance

- **Personas:** Admin/Tutor (manage); Student (member)
- **Features covered (FEATURE_AUDIT §2):** 14 Programs (cohorts) · 17 Attendance
- **Modes:** both
- **Map refs:** FEATURE_AUDIT §3.11, §3.17(attendance via course), §2#17

## Preconditions
- Admin with ≥2 published courses.

## Happy path — programs
- [ ] **Create a program.** Programs → New → name/details → created (status `ACTIVE`). _Ref:_ `routes/program/program.ts`, `schema.ts:2646,2644`.
- [ ] **Add courses to program.** Attach courses → `programCourse` rows. _Ref:_ `schema.ts:2677`.
- [ ] **Add members.** Add students/tutors → `programMember`. _Ref:_ `schema.ts:2704`, middlewares `program-member.ts`, `program-team-member.ts`.
- [ ] **Set goals + deadlines.** Create goals with deadline kinds → `programGoal`/`Assignment`. _Ref:_ `schema.ts:2829,2878,2803-2828`.
- [ ] **Cohort newsfeed.** Post to program newsfeed + comment. _Ref:_ `schema.ts:2739,2767`.
- [ ] **Track progress.** Member progress reflects course completion across the program.
- [ ] **Archive program.** Set `ARCHIVED` → hidden from active lists, data retained. _Ref:_ `schema.ts:2644`.

## Happy path — attendance
- [ ] **Live-class attendance.** For a `LIVE_CLASS` course/session, mark attendance → `groupAttendance` recorded. _Ref:_ `routes/course/attendance.ts`, `schema.ts:321`.
- [ ] **Attendance report** reflects marked records.

## Edge cases / probes
- [ ] **Goal deadline kinds** behave correctly (per enum).
- [ ] **Team vs member permissions** in programs (only team can manage). _Ref:_ `program-team-member.ts`.
- [ ] **Archived program** blocks new activity.

**Coverage:** features 14, 17.
