# Greptile review rules

Repo-specific conventions for code review. See https://www.greptile.com/docs/code-review/custom-standards.

## Out of scope for review

The `prototypes/` directory contains standalone HTML/CSS design mocks and exploration artifacts. They are **not** part of the shipped application and should not receive production code review feedback (navigation semantics, a11y, idempotency, etc.). Skip these paths entirely.

## One-time admin/ops scripts (`packages/db/src/scripts/**`)

These are manual, operator-invoked, run-once maintenance scripts (backfills, notifications, migrations). They are **not** part of the request/runtime path.

- **Do not flag missing idempotency / "can resend on rerun" / "can re-process on rerun".** Re-run behavior is the operator's responsibility, controlled by an explicit `--execute` flag (dry-run by default). This is intentional and not a bug.
- These scripts live in `packages/db` and have **no access to the BullMQ queue or Redis** (`@cio/jobs`), so they send email directly via `@cio/email` (`sendEmail`) rather than the runtime's queued, daily-idempotent path. Do not suggest routing them through the queue as a required change.

## Plan/usage limit checks

- The org student-cap guard (`assertStudentCapacityOrThrow`) reads the count outside the insert transaction. This is a known, accepted best-effort TOCTOU consistent with the existing workspace-allowance check — do not re-flag it as a race-condition bug unless hard atomic enforcement is explicitly requested.

## Course structure and exercises

- Exercises are first-class course items that link directly to courses and sections via `course_id` and `section_id`. `exercise.lesson_id` is deprecated. Never join `lesson` or use `lesson_id` to resolve an exercise's course, section, or progress.

## Code style

- Never call an `await` or a complex/multi-call expression inside an object literal (construction or update). Assign to a well-named local first, then reference it. (Also documented in `AGENTS.md`.)
