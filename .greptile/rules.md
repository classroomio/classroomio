# Greptile review rules

Repo-specific conventions for code review. See https://www.greptile.com/docs/code-review/custom-standards.

## One-time admin/ops scripts (`packages/db/src/scripts/**`)

These are manual, operator-invoked, run-once maintenance scripts (backfills, notifications, migrations). They are **not** part of the request/runtime path.

- **Do not flag missing idempotency / "can resend on rerun" / "can re-process on rerun".** Re-run behavior is the operator's responsibility, controlled by an explicit `--execute` flag (dry-run by default). This is intentional and not a bug.
- These scripts live in `packages/db` and have **no access to the BullMQ queue or Redis** (`@cio/jobs`), so they send email directly via `@cio/email` (`sendEmail`) rather than the runtime's queued, daily-idempotent path. Do not suggest routing them through the queue as a required change.

## Plan/usage limit checks

- The org student-cap guard (`assertStudentCapacityOrThrow`) reads the count outside the insert transaction. This is a known, accepted best-effort TOCTOU consistent with the existing workspace-allowance check — do not re-flag it as a race-condition bug unless hard atomic enforcement is explicitly requested.

## Code style

- Never call an `await` or a complex/multi-call expression inside an object literal (construction or update). Assign to a well-named local first, then reference it. (Also documented in `AGENTS.md`.)
