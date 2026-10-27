# Reviews PRD

## Purpose

Give the people who build a course a place to talk about it, on the content itself. Admins and tutors can leave threaded comments on a course, a section, a lesson, a highlighted passage of a note, a moment in a video, or an exercise question. They can @mention each other, assign a thread to someone, and resolve it when the work is done. Think Figma comments or GitHub pull request reviews, applied to course content.

Agents can do the same through the MCP and the public API, on behalf of the person who owns the API key, the way an agent can leave comments in Notion.

## Problem Statement

Course content is rarely built by one person. A subject-matter expert writes the notes, a designer makes the slides, an instructional designer reviews the flow, and a PM decides when it ships. Today that conversation happens outside ClassroomIO: in Slack threads, Google Docs, and screenshots with arrows on them. Feedback loses its context ("which paragraph?", "which minute of the video?"), nobody knows what is still open, and a course can be published while feedback is unaddressed.

ClassroomIO already has comments, but they are for **learners**: `lesson_comment` is a flat list under a lesson that students see. There is no private, staff-only channel tied to a specific part of the content.

## Naming

The feature is called **Reviews** in the product. A *review thread* is one conversation attached to one place in the course; a *review comment* is one message in a thread.

"Review" already means two other things in the codebase, so the code uses the `content_review` prefix everywhere:

- Course landing-page **reviews**: learner testimonials stored in `course.metadata.reviews`.
- The grading **reviewer** on exercise submissions (`reviewerId`).

Learner comments (`lesson_comment`, `public_lesson_comment`) are unrelated and unchanged.

## Confirmed Decisions

1. **Who has access:** org admins (every course in the org) and tutors on the course. Tutors who are not on the course have no access. Students never see Reviews in any surface.
2. **Paid plans only.** Available on every paid plan (Early Adopter and Enterprise). Not on the free plan.
3. **Anchors in v1:** course, section, lesson, exercise, a highlighted text range in a lesson note, a timestamp in a lesson video, and an exercise question.
4. **Content is never modified to hold anchors.** A thread stores what it points at; the lesson note, videos and exercises are not tagged or rewritten. Only places someone actually comments on are anchored.
5. **Assignment ships in v1.** A thread can have one assignee.
6. **The publish gate ships in v1.** Publishing a course with open review threads requires an explicit human confirmation.
7. **In-app notifications get read state, and email is sent as a digest.** This PRD finishes the read/unread work described in `prd/notification-system`.
8. **Agents are first-class reviewers.** The MCP and the public API expose the full feature. Agent actions are attributed to the API key's creator and visibly marked as made via an agent.
9. **Agents may resolve any thread**, including threads a human opened. The resolve event records that it happened via an agent.
10. **Agents cannot confirm the publish gate.** Only a person in the dashboard can publish a course over open threads.

## Non-Goals (v1)

- Real-time updates (live cursors, comments appearing without a refresh). Threads load on page load, on panel open, and on manual refresh, as the notification system does.
- Anchors on slides, attached documents, or a region inside a video frame.
- Suggested edits with one-click accept.
- External reviewer accounts (people who can comment but are not admins or tutors).
- Slack and webhook delivery of review events.
- Carrying review threads into course clones, templates or exports. They are dropped.
- AI summaries of open feedback (agents can already do this through the MCP tools).

## User Stories

| # | As a… | I want to… | So that… |
|---|-------|-----------|---------|
| 1 | Tutor | Highlight a sentence in a lesson note and comment on it | My feedback points at exactly the words I mean |
| 2 | Tutor | Pause a lesson video and comment at that timestamp | Whoever fixes it can jump straight to the moment |
| 3 | Tutor | Comment on an exercise question | I can flag a wrong answer key without describing where it is |
| 4 | Admin | Start a general thread on a course or section | We can discuss things that aren't about one passage |
| 5 | Any reviewer | @mention a teammate | They get notified and know their input is needed |
| 6 | Any reviewer | Assign a thread to someone | It's clear who owns the fix |
| 7 | Any reviewer | Resolve and reopen threads | The list shows only what's still open |
| 8 | PM / admin | See every open thread across a course | I know whether the course is ready to ship |
| 9 | PM / admin | Be warned before publishing a course with open threads | Nothing ships with unaddressed feedback by accident |
| 10 | Reviewer | Click a notification and land on the exact passage, timestamp or question | I don't have to hunt for context |
| 11 | Reviewer | Get one email digest instead of one email per comment | A busy review doesn't flood my inbox |
| 12 | Person using an agent | Ask my agent to review a module and leave comments | I get a first-pass review without doing it by hand |
| 13 | Person using an agent | Ask my agent to work through open threads, fix the content, and resolve them | Routine feedback gets handled automatically |
| 14 | Reviewer | See whether a comment was written by a person or by an agent on their behalf | I know how much weight to give it |
| 15 | Free-plan admin | See what Reviews does and how to get it | I know the feature exists and that it's on paid plans |

## Concepts

- **Thread:** one conversation attached to one anchor. Has a status (`open` / `resolved`), an optional assignee, and a list of comments.
- **Comment:** one message in a thread. Rich text with @mentions. Its author can edit or delete it.
- **Anchor:** what the thread is about. Stored on the thread, never in the content.
- **Anchor state:** `attached` when the anchor still exists in the content, `outdated` when it no longer can be found (the passage was rewritten, the video was removed, the question was deleted). Outdated threads stay in the panel with the original quote or timestamp.
- **Activity:** created, replied, assigned, unassigned, resolved, reopened, became outdated. Each event records who did it and whether it was via an agent.

## Anchors

| Anchor type | Where it is created | Stored anchor data |
|---|---|---|
| `course` | Course Reviews tab | — (`courseId` only) |
| `section` | Section header menu | `sectionId` |
| `lesson` | Lesson page header | `lessonId` |
| `exercise` | Exercise page header | `exerciseId` |
| `lesson_text` | Highlight text in a lesson note | `lessonId`, `locale`, and a text selector (below) |
| `video_timestamp` | Video player control | `lessonId`, `videoId`, `startSec`, optional `endSec` |
| `exercise_question` | Question card menu | `exerciseId`, `questionId` |

### Text anchors (`lesson_text`)

A text anchor uses the W3C Web Annotation model of a **text quote selector plus a position hint**, measured over the note's plain text (the `textContent` of the rendered note):

```ts
type TReviewTextSelector = {
  exact: string; // the highlighted words
  prefix: string; // up to 32 characters before
  suffix: string; // up to 32 characters after
  start: number; // character offset hint
  end: number;
};
```

Re-anchoring runs **on the server whenever a lesson's content is saved** for that locale, so the stored anchor state is always current for the dashboard, the API, and agents:

1. Find `prefix + exact + suffix`. If found, update `start`/`end`.
2. Otherwise find `exact` alone, choosing the match closest to the old `start`.
3. Otherwise run a fuzzy match (`diff-match-patch` style) near the old position. Accept it above a similarity threshold, starting at 0.8.
4. Otherwise mark the thread `outdated` and keep the stored `exact` text for display.

The dashboard highlights attached threads using the stored offsets, and does not re-run matching itself.

A text anchor belongs to the locale it was created in. When the lesson is viewed in another locale, those threads appear in the side panel under "On the English version" (or whichever locale) and are not highlighted inline.

### Video anchors (`video_timestamp`)

`lesson.videos` is a jsonb array with no stable id per entry today. This feature adds an `id` (uuid) to each video entry, backfilled in the feature's migration, and has every write path that adds a video assign one. Removing a video marks its timestamp threads `outdated`. Replacing a video's source in place keeps the id, so its threads stay attached.

### Exercise question anchors

Questions already have ids. Deleting a question marks its threads `outdated`.

## User Experience

### Plan gate

On the free plan, the Reviews entry points (side panel, course tab) are visible but show an upsell card explaining the feature and linking to billing. No threads can be created.

If an org downgrades to the free plan, its existing threads stay stored and become **read-only**: they can be read, but not replied to, resolved or created. Upgrading again restores full access.

### Creating a thread

- **Highlighted text:** selecting text in a lesson note (edit or preview mode) shows a floating "Comment" button, next to the existing "Quote in chat" button from `lesson/note/quote-selection.svelte`. Clicking it opens a composer anchored to the selection.
- **Video:** the lesson video player gets a "Comment at 2:14" control that pauses the video and opens the composer with the current time. Dragging selects a range.
- **Exercise question:** each question card's menu gets "Comment on question".
- **Section / lesson / exercise / course:** a "Comment" action in the corresponding header or menu.

The composer supports rich text (bold, italic, code, links, lists) and @mentions. Submitting creates the thread and its first comment together.

### In-context indicators

- Attached text threads render as a subtle highlight in the note. Clicking the highlight opens the thread in the side panel.
- Video threads render as markers on the player's scrubber. Clicking a marker seeks to that time and opens the thread.
- Questions with threads show a count badge on the card.
- Rows in the course content sidebar show a badge with the number of open threads on that item.

Resolved threads are hidden in context by default.

### Reviews side panel

A **Reviews** panel is added to the existing side-panel rail (`features/side-panel`), next to the transcript panel. It lists the threads for the current page and supports:

- Scope: **This page** / **Whole course**
- Filters: **Open** (default) / **Resolved** / **Assigned to me** / **Mentions me** / **Outdated**
- Sort: by position on the page (default for "This page") or by most recent activity

Each thread card shows the anchor (quoted text, timestamp, or question title), the first comment, the reply count, the assignee, and the status. Expanding a card shows the full conversation, the reply composer, and the actions: resolve / reopen, assign, follow / unfollow, and copy link.

### Course Reviews tab

The course gets a **Reviews** tab listing every thread in the course, grouped by section and item, with the same filters as the panel plus a filter by assignee. The header shows counts (open, assigned, outdated). This is the "is this course ready?" view.

### Thread anatomy

- Each comment shows the author's avatar, name, relative time, and "edited" if applicable.
- Comments written by an agent show the author plus a **"via agent"** badge with the API key's label in a tooltip, e.g. "Best · via agent (Course review bot)".
- Activity events render inline in the conversation ("Ada assigned this to Sam", "Best resolved this via agent").
- Emoji reactions on comments, with a small fixed set to begin with.
- Authors can edit and delete their own comments. Admins can delete anyone's. Deleting the first comment deletes the thread only if it has no replies; otherwise the comment shows as "deleted".

### Mentions

- Typing `@` opens a picker of people who can see the thread: org admins and the course's tutors. The UI reuses the mention picker from the AI assistant (`ai-assistant/mention-popover.svelte`).
- Mentioning someone subscribes them to the thread and notifies them.
- `@course-team` notifies every tutor on the course and every admin who is subscribed to the course's reviews.
- Mentions are stored as profile ids (mention nodes in the comment body plus `content_review_mention` rows), and the displayed name is resolved at render time.

### Assignment

- A thread has zero or one assignee, chosen from the same people the mention picker offers.
- Assigning notifies the assignee and subscribes them.
- Resolving a thread does not clear the assignee, so "who fixed it" stays visible.

### Publish gate

When a person publishes a course from the dashboard and the course has open threads, a confirmation dialog shows the count of open threads by item, with a link to the course Reviews tab:

- **Cancel** (outline)
- **Publish anyway** (primary)

Publishing through the API or MCP while the course has open threads fails with `409 REVIEWS_OPEN`, listing the counts. There is no API override, so the decision to ship over open feedback is always a person's. Courses with no threads are not affected, so existing API publishing keeps working for orgs that don't use Reviews.

### Notifications

**Who is notified:**

| Event | Recipients |
|---|---|
| New thread | People mentioned in it |
| Reply | Thread subscribers (author, people who replied, people mentioned, assignee) except the replier |
| Mention | The mentioned person |
| Assigned | The new assignee |
| Resolved / reopened | The thread author and the assignee |

Subscriptions can be turned off per thread ("Unfollow").

**In-app:** each event creates a notification row with read state. The bell panel adds the kinds `review_mention`, `review_reply`, `review_assigned` and `review_resolved`. Clicking a notification marks it read and deep-links to the anchor: it opens the page, scrolls to the passage or seeks the video, and opens the thread in the side panel. Text and names are resolved at render time through `NotificationText` (translation key plus params), as the existing panel does.

**Email:** a per-recipient digest. The first event for a recipient schedules a delayed job (10 minutes) on the jobs queue. Events that arrive in that window join the same digest. The email lists the events grouped by course, with deep links built with `getAppBaseUrl()`, because reviewers are staff working in the admin app. This is a **system** email (ClassroomIO-branded, default `from`), because recipients are addressed about their own work in their workspace. It respects the recipient's email notification preferences (`prd/email-notification-preferences`) under a new "Reviews" category.

When an agent caused the event, the notification says so: "Best (via agent) mentioned you in *Intro to React › Lesson 3*".

### Deep links

Every thread has a URL of the form `/courses/{courseId}/{lessons|exercises}/{itemId}?review={threadId}` (or the course Reviews tab for course and section threads). Opening it navigates to the item and opens the thread in the side panel.

## Permissions

| Action | Org admin | Tutor on course | Tutor not on course | Student |
|---|---|---|---|---|
| See threads | ✅ | ✅ | ❌ | ❌ |
| Create threads and reply | ✅ | ✅ | ❌ | ❌ |
| Edit / delete own comments | ✅ | ✅ | ❌ | ❌ |
| Delete other people's comments | ✅ | ❌ | ❌ | ❌ |
| Resolve / reopen any thread | ✅ | ✅ | ❌ | ❌ |
| Assign | ✅ | ✅ | ❌ | ❌ |
| Publish over open threads | ✅ (dashboard only) | per existing publish permission | ❌ | ❌ |

Permissions are checked against the actor's role **at request time**. A tutor removed from a course immediately loses access to its threads. Their past comments stay, with their name.

### Leak prevention

Review data must never reach learners. Explicitly:

- No learner-facing route, org-site route, or student course payload joins review tables.
- "View as student" hides every Reviews UI element.
- AI tutor and learner-side AI context never include review threads.
- Course clone, save-as-template, template instantiate, and course export do not copy threads.
- Public API and MCP access requires the new `reviews:*` scopes, on keys belonging to someone who has access.

Each item gets a test.

## Agents (MCP and public API)

### Identity

Org API keys already record their creator (`organization_api_key.createdByProfileId`), and the automation key middleware exposes it as `actorId` (`apps/api/src/middlewares/automation-key.ts`). Review actions made with a key are:

- **Authored by** the key's creator: `authorProfileId = actorId`.
- **Marked** with the key: `apiKeyId` and `source` (`mcp` or `api`; MCP calls are recognized the same way `v1-mcp-usage.ts` recognizes them).
- **Authorized** with the creator's current role on the course. If the creator loses access, the key loses access to reviews too.

The key's label is looked up at render time, not copied into the comment.

### Scopes

Add `reviews:read` and `reviews:write` to the public API scopes (`public-api-scopes.ts`), and expose them in the API key creation UI.

### Public API endpoints

Under the existing `/v1/courses` router:

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/courses/:courseId/reviews` | List threads. Filters: `status`, `anchorType`, `lessonId`, `exerciseId`, `assignee` (`me` or profile id), `mentions=me`, `anchorState`; paginated |
| GET | `/v1/courses/:courseId/reviews/:threadId` | Thread with comments, activity, and resolved anchor (quote, timestamp, question title) |
| POST | `/v1/courses/:courseId/reviews` | Create a thread with its first comment |
| POST | `/v1/courses/:courseId/reviews/:threadId/comments` | Reply |
| PATCH | `/v1/courses/:courseId/reviews/:threadId/comments/:commentId` | Edit a comment written by this key |
| DELETE | `/v1/courses/:courseId/reviews/:threadId/comments/:commentId` | Delete a comment written by this key |
| POST | `/v1/courses/:courseId/reviews/:threadId/resolve` | Resolve |
| POST | `/v1/courses/:courseId/reviews/:threadId/reopen` | Reopen |
| PUT | `/v1/courses/:courseId/reviews/:threadId/assignee` | Set or clear the assignee |
| PUT | `/v1/courses/:courseId/reviews/:threadId/comments/:commentId/reactions` | Set the key's reaction |

### MCP tools (`packages/mcp/src/tools/reviews.ts`)

| Tool | Annotation | Maps to |
|---|---|---|
| `list_review_threads` | read-only | GET list |
| `get_review_thread` | read-only | GET thread |
| `create_review_thread` | write | POST thread |
| `reply_to_review_thread` | write | POST comment |
| `edit_review_comment` | write | PATCH comment |
| `delete_review_comment` | destructive | DELETE comment |
| `resolve_review_thread` | write | POST resolve |
| `reopen_review_thread` | write | POST reopen |
| `assign_review_thread` | write | PUT assignee |
| `react_to_review_comment` | write | PUT reaction |

Tool descriptions should teach the main workflows: read lessons with the existing lesson tools, then create text-anchored threads; or list open threads, fix the content with the existing lesson and exercise tools, reply with what changed, and resolve.

For mentions, agents pass profile ids (from the existing team listing tools) in a structured `mentions` array alongside the body. The server builds the mention nodes.

### Guardrails for agents

- **Text anchors must match.** `create_review_thread` with a `lesson_text` anchor takes `exact` (plus optional `prefix`/`suffix`) and the server locates it in the current content. If it isn't found, the call fails with `REVIEW_ANCHOR_NOT_FOUND` instead of creating a floating thread. This stops agents from inventing passages.
- **Rate limits per key** (starting values, tuned after launch): 60 new threads per hour, 200 comments per hour, 30 notified mentions per hour. Mentions beyond the limit are stored but do not notify.
- **Usage is logged** in `organization_automation_usage` like other automation actions.
- **No publish override** (see the publish gate).

## Data Model

All new tables are keyed on `profile.id` and organization, not `groupmember`, so course-wide and cross-course queries stay simple. One migration for the whole feature.

### `content_review_thread`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `organization_id` | uuid FK → organization, cascade | |
| `course_id` | uuid FK → course, cascade | |
| `anchor_type` | enum `CONTENT_REVIEW_ANCHOR_TYPE` | `course`, `section`, `lesson`, `exercise`, `lesson_text`, `video_timestamp`, `exercise_question` |
| `section_id` | uuid FK → course_section, cascade, nullable | |
| `lesson_id` | uuid FK → lesson, cascade, nullable | |
| `exercise_id` | uuid FK → exercise, cascade, nullable | |
| `question_id` | bigint FK → question, set null, nullable | Set null so the thread survives as outdated |
| `anchor` | jsonb, nullable | Type-specific data: text selector or video timestamp; validated by a Zod discriminated union |
| `locale` | locale enum, nullable | Only for `lesson_text` |
| `status` | enum `CONTENT_REVIEW_STATUS` | `open`, `resolved` |
| `anchor_state` | enum `CONTENT_REVIEW_ANCHOR_STATE` | `attached`, `outdated` |
| `assignee_profile_id` | uuid FK → profile, set null, nullable | |
| `created_by_profile_id` | uuid FK → profile | |
| `created_via_api_key_id` | uuid FK → organization_api_key, set null, nullable | |
| `resolved_by_profile_id` | uuid FK → profile, nullable | |
| `resolved_via_api_key_id` | uuid FK → organization_api_key, set null, nullable | |
| `resolved_at` | timestamptz, nullable | |
| `last_activity_at` | timestamptz | For sorting |
| `created_at`, `updated_at` | timestamptz | |

Indexes: `(course_id, status)`, `(lesson_id)`, `(exercise_id)`, `(assignee_profile_id, status)`.

A check constraint ensures the id columns match the anchor type (e.g. `lesson_text` requires `lesson_id`, `anchor` and `locale`).

### `content_review_comment`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `thread_id` | uuid FK → content_review_thread, cascade | |
| `author_profile_id` | uuid FK → profile | |
| `api_key_id` | uuid FK → organization_api_key, set null, nullable | Set when written via an agent |
| `source` | enum `CONTENT_REVIEW_SOURCE` | `dashboard`, `mcp`, `api` |
| `body` | text | Sanitized rich text exactly as authored; mention nodes carry profile ids only |
| `edited_at` | timestamptz, nullable | |
| `deleted_at` | timestamptz, nullable | Soft delete so replies keep context |
| `created_at` | timestamptz | |

### `content_review_mention`

`comment_id` (FK cascade), `profile_id` (FK cascade), unique on the pair. Powers "Mentions me" and notifications.

### `content_review_reaction`

`comment_id` (FK cascade), `profile_id` (FK cascade), `emoji` (varchar), unique on `(comment_id, profile_id, emoji)`.

### `content_review_subscription`

`thread_id` (FK cascade), `profile_id` (FK cascade), `subscribed` (boolean; `false` records an explicit unfollow), unique on the pair.

### `content_review_event`

`id`, `thread_id` (FK cascade), `type` (`created`, `assigned`, `unassigned`, `resolved`, `reopened`, `outdated`, `reattached`), `actor_profile_id` (nullable for system events like `outdated`), `api_key_id` (nullable), `metadata` jsonb (e.g. the assignee id), `created_at`.

### Notifications

In-app notifications are stored per the notification system PRD (a `notification` table with `recipient_profile_id`, `kind`, `source_id`, `read_at`, `created_at`). If that table does not exist when this work starts, this feature creates it as part of the same migration.

### `lesson.videos`

Each video entry gains an `id` (uuid string). The migration backfills existing entries. All write paths (dashboard, API, MCP, course import, clone) assign one for new entries and keep it on edit.

## Technical Design

### Plan gating (`packages/utils/src/plans/constants.ts`)

Add `FEATURES.EA_REVIEWS` to `EARYL_ADOPTER_FEATURES`; Enterprise inherits it. The API checks `hasFeature(FEATURES.EA_REVIEWS, plan)` in a `requireReviewsPlan` middleware on every write route, and serves read routes on any plan, so the downgrade read-only rule falls out of the same check. Self-hosted orgs get the Enterprise plan and therefore Reviews.

### Validation (`packages/utils/src/validation/review/`)

- `ZReviewAnchor`: discriminated union on `anchorType`.
- `ZCreateReviewThread`, `ZCreateReviewComment`, `ZUpdateReviewComment`, `ZSetReviewAssignee`, `ZSetReviewReaction`, `ZListReviewThreadsQuery`.
- Public API variants (`ZPublicApi…`) in `validation/public-api` reuse these.

### Query layer (`packages/db/src/queries/review/`)

`threads.ts`, `comments.ts`, `mentions.ts`, `reactions.ts`, `subscriptions.ts`, `events.ts`. Pure functions that accept an optional `DbOrTxClient`.

### Services (`apps/api/src/services/review/`)

- `thread.ts`: create (thread + first comment + mentions + subscriptions + event in one transaction), list, get, resolve, reopen, assign.
- `comment.ts`: reply, edit, delete, react.
- `anchor.ts`: text matching and re-anchoring. Called from the lesson content save service and from video and question delete paths, inside their transactions.
- `notify.ts`: works out recipients and enqueues notifications and digest jobs **after** the transaction commits.
- `access.ts`: "is admin, or tutor on this course" check, shared by dashboard and API routes.

### Routes

- Dashboard: `apps/api/src/routes/course/review.ts`, mounted inside the course router, using the session auth plus a course-team middleware (admin or tutor on the course).
- Public API: `apps/api/src/routes/v1/courses/reviews.ts`, using `course-team-member-or-automation-key` plus the `reviews:*` scopes.
- The course publish service checks open threads: the dashboard sends `confirmOpenReviews: true` after the dialog, and the v1 route never accepts that flag.

### Jobs (`apps/jobs`)

`review-digest` job: delayed per recipient, gathers unsent review notifications, sends the digest email, and marks them emailed.

### Email (`packages/email/src/emails/review-digest.ts`)

System template, no `branding` field, rendered with `getDefaultTemplate(content)`.

### Dashboard (`apps/dashboard/src/lib/features/review/`)

- `utils/types.ts`: request and response types inferred from the RPC client.
- `api/review.svelte.ts`: `ReviewApi` class (list, get, create, reply, edit, delete, resolve, reopen, assign, react, subscribe).
- `components/`: `review-panel.svelte` (side panel), `review-thread-card.svelte`, `review-thread.svelte`, `review-composer.svelte`, `review-text-highlights.svelte` (highlights in the note), `review-video-markers.svelte`, `review-question-badge.svelte`, `review-publish-dialog.svelte`, `review-upsell.svelte`.
- Course Reviews tab route under `routes/(app)/courses/[id]/reviews/`.
- Side panel registration in `features/side-panel`.
- Notification kinds added to `features/notifications/utils/types.ts` and mapped in `notification-utils.ts`.

Reusable presentational pieces (thread card, comment row, composer shell) go in `packages/ui/src/custom/review-*`, each with a Storybook story covering empty, loading, open, resolved, outdated, agent-authored and deleted states.

### MCP (`packages/mcp`)

`src/tools/reviews.ts` with the tools above; client methods in `src/api-client.ts`; registered in `src/index.ts`.

### Translations

All copy goes under a new `reviews.*` namespace in `en.json`, then `pnpm translate`. Keys include the panel title, filters, empty states, composer placeholder, actions, activity sentences (`reviews.activity.resolved_via_agent`, etc.), the "via agent" badge, outdated and other-locale labels, the publish dialog, the upsell card, and notification titles and bodies.

## Acceptance Criteria

- [ ] On a paid plan, an admin and a course tutor can create threads on every v1 anchor type.
- [ ] A tutor not on the course and any student get `403` from every review route, and see no Reviews UI.
- [ ] Highlighting text in a note and commenting creates a `lesson_text` thread that is highlighted inline after reload.
- [ ] Editing the note around the passage keeps the thread attached; deleting the passage marks it outdated, and it shows in the panel with the original quote.
- [ ] A text thread created in one locale shows in the panel (not inline) when the lesson is viewed in another locale.
- [ ] A video timestamp thread shows a scrubber marker; clicking it seeks to the time and opens the thread.
- [ ] Mentioning someone notifies them in-app and in the next email digest; the in-app notification deep-links to the anchor and becomes read when clicked.
- [ ] Several events within 10 minutes produce one digest email per recipient.
- [ ] Assigning, resolving and reopening record activity events and notify the right people.
- [ ] Publishing from the dashboard with open threads shows the confirmation dialog; publishing through the API or MCP returns `409 REVIEWS_OPEN`.
- [ ] An MCP key with `reviews:write` can create, reply to, assign and resolve threads; every comment and event shows the key creator plus the "via agent" badge.
- [ ] A `lesson_text` anchor whose quote isn't in the lesson fails with `REVIEW_ANCHOR_NOT_FOUND`.
- [ ] Removing the key creator from the course makes their key's review calls fail.
- [ ] Free-plan orgs see the upsell card and cannot create threads; a downgraded org can read but not write.
- [ ] No review data appears in student payloads, "view as student", AI tutor context, clones, templates or exports.
- [ ] Deleting a lesson, exercise or course removes its threads.

## Implementation Order

### Phase 1 — Data and core API

1. Migration: review tables, enums, notification read state (if missing), `lesson.videos[].id` backfill.
2. Validation schemas, query layer, services, dashboard routes.
3. Re-anchoring hooked into lesson save, video removal and question deletion.
4. Plan gate and access middleware.

### Phase 2 — Dashboard

1. Side panel, thread card, composer, mentions.
2. Text highlights, video markers, question badges, content sidebar counts.
3. Course Reviews tab.
4. Publish dialog and upsell card.

### Phase 3 — Notifications

1. In-app notification kinds, read state, and deep links.
2. Digest job and email template, preference category.

### Phase 4 — Agents

1. Scopes, `/v1` routes, rate limits, usage logging.
2. MCP tools and tool descriptions.
3. Public API docs.

## Open Questions

1. **Digest window:** is 10 minutes right, or should it follow the email preferences (instant / hourly / daily)?
2. **Rate limits:** are the starting agent limits (60 threads, 200 comments, 30 notified mentions per key per hour) reasonable?
3. **Reaction set:** a fixed set (👍 ❤️ 🎉 👀 ✅) or a full emoji picker?
4. **Course Reviews tab placement:** its own tab in the course nav, or a view inside the course's content page?
