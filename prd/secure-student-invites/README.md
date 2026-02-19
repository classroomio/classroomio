# Secure Student Invite Flow

## Purpose
Document the current secure student invite architecture, what is implemented right now, and what should be implemented next to make the invite system excellent for a modern course platform.

## Scope
- Student invitations into a course
- Security controls around link generation and acceptance
- Teacher/admin management surface for invite links

## Current Flow (Implemented)

### 0. Public landing page enroll button (free courses)
1. User clicks Enroll on a free course landing page.
2. Frontend calls `POST /invite/student/public-link` with `courseId`.
3. Backend validates course is active, published, and accepting students.
4. Backend creates a one-time secure invite token (24h expiry).
5. Frontend redirects user to `/invite/s/:token`.

### 1. Teacher creates invite link
1. Teacher opens the invite modal in the course people page.
2. Frontend calls `POST /course/:courseId/invites`.
3. Backend creates a cryptographically random token.
4. Backend stores only `sha256(token)` in `course_invite.token_hash`.
5. Backend returns a single usable invite URL: `/invite/s/:token`.

### 2. Student opens invite link
1. Student hits invite page with token in URL.
2. Frontend calls `GET /invite/student/:token/preview`.
3. Backend hashes token and looks up invite by `token_hash`.
4. Backend returns invite + course + organization preview data and computed status.

### 3. Student accepts invite
1. Student clicks Join.
2. Frontend calls `POST /invite/student/:token/accept` (authenticated route).
3. Backend performs checks in a transaction:
- invite exists
- invite role is student
- invite is active (not expired/revoked/used up)
- course is active and published
- course allows new students
- optional email/domain restrictions pass
- if restricted invite, verified email is required
4. Backend idempotently handles already-joined students.
5. Backend inserts missing org membership + group membership.
6. Backend atomically increments invite usage with race-safe condition.
7. Backend sends welcome email to student and notification emails to teachers.

### 4. Teacher can revoke
1. Teacher calls `POST /course/:courseId/invites/:inviteId/revoke`.
2. Invite is marked revoked and immediately blocked from future joins.

## Functionalities Implemented

### Database
- New `course_invite` table in `packages/db/src/schema.ts`.
- Fields include:
- `tokenHash`, `expiresAt`, `maxUses`, `usedCount`, `isRevoked`
- `allowedEmails`, `allowedDomains`, `metadata`
- `createdByProfileId`, `lastUsedAt`, timestamps
- Indexes and uniqueness on token hash.

### API and Service Layer
- Course-level invite management routes:
- `GET /course/:courseId/invites`
- `POST /course/:courseId/invites`
- `POST /course/:courseId/invites/:inviteId/revoke`
- Public/auth invite routes:
- `POST /invite/student/public-link`
- `GET /invite/student/:token/preview`
- `POST /invite/student/:token/accept`
- Invite validation schemas added for params and payloads.
- Legacy invite fallback removed; only secure tokenized invites are supported (including landing-page enroll flow).

### Security Controls
- High-entropy token generation (`crypto.randomBytes`).
- Token hashing at rest (no raw token stored in DB).
- Expiry, max-use, and revocation enforcement.
- Public free-course enroll flow issues one-time, short-lived secure links instead of payload-derived links.
- Optional allowlist restrictions (emails/domains).
- Verified-email enforcement for restricted invites.
- Transactional acceptance with optimistic concurrency guard on `usedCount`.
- Idempotent join behavior to avoid duplicate consumption.

### Dashboard / UX
- Invite modal now requests server-generated secure links.
- Copy-link and QR features use secure link output.
- Invite join page uses backend preview + accept endpoints.
- Invite join page shows clear blocked states for expired/revoked/used-up/unavailable course.

## What I Recommend Next (Priority Order)

### P0: Must-have next
1. Invite management UI in course people page:
- list invites
- show status and uses left
- revoke from UI
- copy existing invite link metadata (without exposing raw token again)
2. Per-invite presets:
- one-time link
- multi-use link
- short expiry presets (24h, 7d, 30d)
3. Full audit trail:
- who created/revoked invite
- who joined with invite
- timestamped acceptance history

### P1: High impact
1. Direct email invites (personalized):
- issue invite per recipient
- send one-click email invites
- track delivery/open/accept
2. Bulk invite import:
- CSV of emails
- domain validation and duplicate detection
3. Abuse protection:
- rate limits on preview/accept
- IP/device anomaly detection

### P2: Advanced platform features
1. SSO/domain auto-enrollment rules:
- trusted domains auto-map to org/course policies
2. Invite analytics dashboard:
- conversion funnel (created -> opened -> accepted)
- per-course acceptance rates
3. Expiry automation:
- automatic cleanup/archive
- reminders before expiration

## Suggested Product Standard for an Outstanding Course Platform
- Secure by default (hashed tokens, expiry, revocation, least privilege).
- Clear invite lifecycle (active, expired, used up, revoked) visible to staff.
- Excellent failure UX for students (explicit reason + next action).
- Strong governance (audit logs and admin controls).
- Scalable operations (bulk invite, email campaigns, analytics).

## Validation Status
- `pnpm --filter @cio/db build` passed.
- `pnpm --filter @cio/utils build` passed.
- `pnpm --filter @cio/api build` passed.
- `pnpm --filter @cio/dashboard build` passed (with unrelated pre-existing Svelte warnings).
