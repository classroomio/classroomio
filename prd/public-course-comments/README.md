# Public Course Comments PRD

## Purpose

Enable learners to leave comments on public course lessons. Comments are visible to all visitors without authentication but require sign-in and email verification to post. The feature mirrors the comment experience on enrolled courses while keeping the read-only lesson experience intact for anonymous visitors.

## Problem Statement

Public course lessons on ClassroomIO are currently one-way. Learners can read and watch content but have no way to engage with it publicly. Courses with enrollment already support comments, but public courses — which are primarily used as top-of-funnel and community content — have no equivalent. This creates a lower-quality experience for orgs who publish public courses as a lead-generation or thought-leadership surface: there is no social proof, no discussion, and no way to build a learner community around the content.

## Confirmed Decisions

1. **Lesson-only**: Comments are added to lesson items only. Exercise pages are excluded from v1.
2. **Read-only for anonymous visitors**: Anyone can see existing comments; a sign-in prompt replaces the input form.
3. **Email verification required to post**: Matching the trust bar set by enrolled-course comments.
4. **No edit on public comments**: Delete only, to keep the feature minimal.
5. **Respects the org's comments toggle**: If `customization.apps.comments` is disabled for the org, the section is hidden — same as enrolled-course behavior.
6. **Separate data model**: Public comments use a new `public_lesson_comment` table tied directly to `profile.id`. The existing `lesson_comment` table (which ties to `groupmember.id`) is not changed.
7. **`PUBLIC` course type only**: Other course types (Self-Paced, Live Class, Compliance) require enrollment and already use the existing enrolled-course comment system.

## Non-Goals (v1)

- Comments on exercise pages.
- Editing a posted comment (delete is sufficient).
- Comment moderation tools (flagging, muting, admin delete UI).
- Replies / threaded discussions.
- Notifications when someone comments on a lesson.
- Rich-text / markdown formatting — plain text only.
- Anonymous (unauthenticated) commenting.
- Comment counts in the course sidebar or lesson list.

## User Stories

| # | As a… | I want to… | So that… |
|---|-------|-----------|---------|
| 1 | Anonymous visitor | See existing comments on a public lesson | I get social proof and learn from others before deciding to sign up |
| 2 | Anonymous visitor | See a clear prompt to sign up or log in from the comment section | I can join the conversation without hunting for the sign-in link |
| 3 | Newly signed-up user | Know my email needs verification before I can comment | I understand why the form is disabled and what to do next |
| 4 | Newly signed-up user | Receive a verification email automatically when I land back on the lesson | I don't have to dig through settings to trigger the verification flow |
| 5 | Newly signed-up user | Resend the verification email if it didn't arrive | I'm not blocked if the first email went to spam |
| 6 | Verified user | Post a comment on any public lesson | I can contribute to the discussion |
| 7 | Verified user | Delete my own comment | I can remove something I posted by mistake |
| 8 | Verified user | Load older comments | I can read the full discussion history |

## User Experience

### State 1 — Anonymous Visitor

The comment section renders below the lesson content. All existing comments are displayed in full with author avatars, names, and relative timestamps. The input area is replaced by a full-width alert card:

> **Join the discussion**
> Create an account or sign in to leave a comment.
> [Sign up]  [Log in]

Both buttons append `?redirect=<encoded current lesson URL>` so the user is returned to the exact lesson after authentication.

### State 2 — Logged In, Unverified

The alert card is replaced by an amber verification banner:

> **Verify your email to comment**
> We sent a verification email to `user@example.com`. Click the link to start commenting.
> [Resend email]  *(or: "Resend in 90s…" while cooling down)*

The comment textarea is rendered but disabled. On component mount, a verification email is sent automatically once — using the same `trigger=app` pattern used elsewhere in the app (`verify-email-modal.svelte`). A 120-second cooldown prevents the "Resend" button from being spammed.

### State 3 — Logged In, Verified

Full comment form: textarea + "Post" button. Comment list below with:
- Author avatar, display name (own comments shown as "You"), relative timestamp.
- Delete option on own comments only (ellipsis menu or trash icon).
- "Load more" button when more comments exist beyond the first page.

### Email Verification Behavior

Email verification is **not** sent automatically on signup. The app's `sendVerificationEmail` handler (`packages/db/src/auth/email-verification.ts`) is intentionally gated — it only fires when `trigger=app` is present in the callback URL. Better Auth would otherwise send on signup, but this project blocks that and makes the UI responsible.

The comment component replicates the auto-send pattern from `verify-email-modal.svelte`: on mount, if `isLoggedIn && !isEmailVerified`, it calls `authClient.sendVerificationEmail` once with a `callbackURL` that includes `trigger=app` and points back to the current lesson. The `trigger=app` param is stripped before the link is embedded in the email, so the user's click lands cleanly on the lesson page where the session refreshes and the form unlocks automatically.

## Data Model

### New Table: `public_lesson_comment`

```typescript
// packages/db/src/schema.ts
export const publicLessonComment = pgTable('public_lesson_comment', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lessonId: uuid('lesson_id').notNull().references(() => lesson.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').notNull().references(() => profile.id, { onDelete: 'cascade' }),
  comment: text('comment').notNull()
});
```

Public comments use `profileId` directly (no group membership required). The existing `lesson_comment` table is unchanged.

## API Endpoints

All three are appended to the existing `publicCourseRouter` under `/org-site/course`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/:courseSlug/item/:itemSlug/comment` | None | List comments (cursor-paginated, default 10, max 50) |
| `POST` | `/:courseSlug/item/:itemSlug/comment` | Required + email verified | Create a comment |
| `DELETE` | `/:courseSlug/item/:itemSlug/comment/:commentId` | Required + owns comment | Delete own comment |

The `POST` endpoint returns `403` with a distinct error code if the user is authenticated but their email is unverified, so the client can show the right prompt rather than a generic error.

## Technical Design

### Validation (`packages/utils/src/validation/course/course.ts`)

Add:
- `ZPublicCommentCreate` — `{ comment: z.string().min(1).max(2000) }`
- `ZPublicCommentCursorQuery` — `{ cursor?: string, limit: z.coerce.number().min(1).max(50).default(10) }`
- `ZPublicCommentDeleteParam` — extends `ZPublicCourseItemParam` with `commentId: z.coerce.number()`

### Query Layer (`packages/db/src/queries/course/public-comment.ts`) — new file

- `getPublicLessonCommentsPaginated(lessonId, { cursor, limit })` — cursor-based, joins with `profile` for author name and avatar.
- `createPublicLessonComment(lessonId, profileId, comment)` — inserts and returns the new row with profile join.
- `deletePublicLessonComment(commentId, profileId)` — deletes only if `profileId` matches the row (ownership check at the query layer).

### Service Layer (`apps/api/src/services/course/public-comment.ts`) — new file

- `getPublicCommentsService(courseSlug, itemSlug, options)` — resolves the lesson from slugs, calls paginated query.
- `createPublicCommentService(courseSlug, itemSlug, user, comment)` — throws `AppError (403, EMAIL_NOT_VERIFIED)` if `user.isEmailVerified` is false; resolves lesson, sanitizes comment via `sanitizeHtml`, calls create query.
- `deletePublicCommentService(courseSlug, itemSlug, commentId, profileId)` — resolves lesson, delegates delete with ownership check to query layer.

### API Routes (extend `apps/api/src/routes/org-site/public-course.ts`)

Add to the existing `publicCourseRouter` after the HLS cookie endpoint.

### Frontend Types (`apps/dashboard/src/lib/features/course/utils/types.ts`)

Add:
```typescript
export type GetPublicCommentsRequest = typeof classroomio['org-site'].course[':courseSlug'].item[':itemSlug'].comment.$get;
export type CreatePublicCommentRequest = typeof classroomio['org-site'].course[':courseSlug'].item[':itemSlug'].comment.$post;
export type DeletePublicCommentRequest = (typeof classroomio['org-site'].course[':courseSlug'].item[':itemSlug'].comment)[':commentId']['$delete'];

export type PublicCommentsSuccess = Extract<InferResponseType<GetPublicCommentsRequest>, { success: true }>;
export type PublicCommentItem = PublicCommentsSuccess['data']['items'][number];
```

### API Class (`apps/dashboard/src/lib/features/course/api/public-comments.svelte.ts`) — new file

Extends `BaseApiWithErrors`. Reactive state: `items`, `hasMore`, `totalCount`, `cursor`, `isLoading`, `isSubmitting`. Methods: `getComments`, `loadMore`, `createComment`, `deleteComment`.

### Component (`apps/dashboard/src/lib/features/course/components/lesson/public-comments.svelte`) — new file

Props: `courseSlug: string`, `itemSlug: string`

Renders one of three states based on `$user.isLoggedIn` and `$profile.isEmailVerified`. Fetches comments on mount via the API class. Width matches the `PublicLessonView`: `mx-auto w-full max-w-3xl px-4`.

### Page Integration (`apps/dashboard/src/routes/(org-site)/course/[slug]/lesson/[itemSlug]/+page.svelte`)

Add below the `PublicLessonView` block:
```svelte
{#if lessonView && $currentOrg.customization?.apps?.comments !== false}
  <PublicComments courseSlug={data.tree.course.slug} itemSlug={itemSlug} />
{/if}
```

### Translations (`apps/dashboard/src/lib/utils/translations/en.json`)

Add under `public_course.comments`:
```json
{
  "title": "Comments ({count})",
  "sign_in_prompt_title": "Join the discussion",
  "sign_in_prompt_body": "Create an account or sign in to leave a comment.",
  "sign_up_btn": "Sign up",
  "login_btn": "Log in",
  "verify_title": "Verify your email to comment",
  "verify_body": "We sent a verification email to {email}. Click the link to start commenting.",
  "resend_btn": "Resend email",
  "resend_cooldown": "Resend in {seconds}s",
  "placeholder": "Write a comment...",
  "post_btn": "Post",
  "load_more_btn": "Load more",
  "you": "You",
  "delete_btn": "Delete",
  "empty": "No comments yet. Be the first to start the discussion."
}
```

## Scope of Changes

| Layer | File | Change |
|-------|------|--------|
| DB schema | `packages/db/src/schema.ts` | Add `publicLessonComment` table |
| DB queries | `packages/db/src/queries/course/public-comment.ts` | **New** — paginated get, create, delete |
| Validation | `packages/utils/src/validation/course/course.ts` | Add 3 Zod schemas |
| API service | `apps/api/src/services/course/public-comment.ts` | **New** — business logic + email-verified guard |
| API routes | `apps/api/src/routes/org-site/public-course.ts` | Extend `publicCourseRouter` with 3 endpoints |
| Frontend types | `apps/dashboard/src/lib/features/course/utils/types.ts` | Add public comment request/response types |
| Frontend API class | `apps/dashboard/src/lib/features/course/api/public-comments.svelte.ts` | **New** — state + methods |
| UI component | `apps/dashboard/src/lib/features/course/components/lesson/public-comments.svelte` | **New** — 3-state comments section |
| Page | `apps/dashboard/src/routes/(org-site)/course/[slug]/lesson/[itemSlug]/+page.svelte` | Mount `<PublicComments>` below lesson view |
| Translations | `apps/dashboard/src/lib/utils/translations/en.json` | Add `public_course.comments.*` keys |

## Implementation Order

### Phase 1 — Data + API
1. Add `publicLessonComment` to `packages/db/src/schema.ts`.
2. Create `packages/db/src/queries/course/public-comment.ts`.
3. Add 3 Zod schemas to `packages/utils/src/validation/course/course.ts`.
4. Create `apps/api/src/services/course/public-comment.ts`.
5. Extend `apps/api/src/routes/org-site/public-course.ts` with comment endpoints.
6. Build: `pnpm --filter @cio/db build && pnpm --filter @cio/utils build && pnpm --filter @cio/api build`.

### Phase 2 — Frontend
1. Add types to `apps/dashboard/src/lib/features/course/utils/types.ts`.
2. Create `apps/dashboard/src/lib/features/course/api/public-comments.svelte.ts`.
3. Add translation keys to `apps/dashboard/src/lib/utils/translations/en.json`; run `pnpm translate`.
4. Create `apps/dashboard/src/lib/features/course/components/lesson/public-comments.svelte`.
5. Mount the component in the lesson page.

## Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| AC-1 | Anonymous user opens a public lesson with existing comments | Comments list renders; sign-in alert card shown; no input form |
| AC-2 | Anonymous user opens a public lesson with no comments | Empty state + sign-in alert card |
| AC-3 | Anonymous user clicks "Sign up" | Redirected to `/signup?redirect=<lesson URL>` |
| AC-4 | Anonymous user clicks "Log in" | Redirected to `/login?redirect=<lesson URL>` |
| AC-5 | User completes signup and is redirected back | Amber verification banner shown; textarea visible but disabled |
| AC-6 | Verification email auto-sent on landing | `sendVerificationEmail` fires once on component mount; user receives the email |
| AC-7 | User clicks "Resend" | Email re-sent; button enters cooldown ("Resend in 117s…"); cannot click again until countdown expires |
| AC-8 | User clicks verification link in email | Redirected to lesson; banner gone; comment form active — no page reload required |
| AC-9 | Verified user submits a comment | Comment appears at top of list; author shown as "You" |
| AC-10 | Verified user tries to post empty input | "Post" button stays disabled |
| AC-11 | Verified user deletes own comment | Comment removed; count decrements |
| AC-12 | Verified user views another user's comment | No delete option shown |
| AC-13 | Lesson has >10 comments | "Load more" button shown; clicking appends next page |
| AC-14 | Unverified user calls `POST /comment` directly (API bypass) | Returns `403` with `EMAIL_NOT_VERIFIED` error code |
| AC-15 | Exercise page | No comments section rendered |
| AC-16 | Org has `customization.apps.comments` disabled | Comments section hidden entirely |
| AC-17 | Non-`PUBLIC` course type (Self-Paced, Live Class, Compliance) | New public comments section not rendered; enrolled-course comment system unchanged |

## Open Questions

| # | Question | Default assumption if not resolved |
|---|----------|------------------------------------|
| Q1 | Should there be a per-org toggle specifically for public course comments, separate from the enrolled-course comments toggle? | Reuse the same `customization.apps.comments` toggle — one control for both surfaces |
| Q2 | Should comments on a public lesson also be visible to enrolled students viewing the same lesson in the authenticated LMS view? | No — the two tables (`lesson_comment` vs `public_lesson_comment`) are separate; enrolled students see enrolled comments, public visitors see public comments |
