# Flow 03 — People, invites & roles

- **Personas:** Admin/Tutor (inviter) → Tutor & Student (invitee)
- **Features covered (FEATURE_AUDIT §2):** 5 Team / people management · 9 Course people / enrollment · 10 Course invites · 11 Org invites
- **Modes:** cloud + self-host
- **Map refs:** FEATURE_AUDIT §3.8, §4 (roles/RBAC)

## Preconditions
- Logged in as Admin with at least one published course (from Flow 02).
- A second email inbox (or alias) to receive invites and accept as a new user.

## Happy path — org-level

- [ ] **Invite an org member (email).** Org → People → invite a teacher by email, role = Tutor → invite created, email sent. _Ref:_ `routes/invite/invite.ts`, `schema.ts:1384`, EMAIL/LINK enum `schema.ts:71`.
- [ ] **Invite via link.** Generate a link invite → copyable URL works. _Ref:_ same; audit `schema.ts:1448`.
- [ ] **Accept org invite.** Open invite as the invitee → accept → becomes org member with the assigned role. _Ref:_ §3.8.
- [ ] **Role enforcement — Tutor.** As the new Tutor: can author/manage courses, grade, moderate; **cannot** access org settings/billing/member roles. _Ref:_ `middlewares/org-team-member.ts`, `org-admin.ts`, §4 table.
- [ ] **Role enforcement — Admin only.** Confirm org settings/billing are Admin-only (Tutor gets 403). _Ref:_ `org-admin.ts`.

## Happy path — course-level

- [ ] **Invite a student to a course (email).** Course → People → invite by email → `courseInvite` row + audit event. _Ref:_ `services/course/invite.ts`, `schema.ts:1282,1342`, event enum `schema.ts:53`.
- [ ] **Course link invite.** Create a shareable link → `/invite/link/[hash]` works. _Ref:_ `apps/dashboard/src/routes/invite/link/[hash]`.
- [ ] **Accept course invite → enrolled.** Open `/invite/[hash]` as invitee → accept → appears in course roster as Student. _Ref:_ `apps/dashboard/src/routes/invite/[hash]`, `routes/course/people.ts`.
- [ ] **Roster reflects enrollment.** Course People list shows the new student with correct role.

## Edge cases / probes

- [ ] **Expired / custom-expiry invite** → rejected with clear message. _Ref:_ `customExpiresAt` (AGENTS.md:231).
- [ ] **Re-using a consumed invite link** → blocked.
- [ ] **Invite an email that's already a member** → no duplicate member row. _Ref:_ `hasOrgMemberByProfileIdOrEmail`.
- [ ] **Invite-only signup interplay:** invited email can sign up even when org is invite-only. _Ref:_ Flow 01 / `signup-guard.ts:97-113`.
- [ ] **Audit trail recorded** for invite create/accept events. _Ref:_ `schema.ts:1342,1448`.
- [ ] **Student cannot perform team actions** (authoring/grading) → 403. _Ref:_ §4.

**Coverage:** features 5, 9, 10, 11.
