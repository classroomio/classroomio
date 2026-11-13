# @classroomio/mcp

> **Deprecated.** Running this package through `npx` with `CLASSROOMIO_API_KEY` is deprecated. Connect to the hosted server at `https://mcp.classroomio.com` instead: your client signs in with your ClassroomIO account and no key or Node.js install is needed. This package keeps working for now and is still the only way to use `upload_video`, which reads a file from your own computer. See [Connect an MCP client](https://classroomio.com/docs/developers/mcp/setup).

Thin MCP server for ClassroomIO course authoring. It runs over stdio for local clients, and ClassroomIO's API also serves it over HTTP for remote clients.

The package does not parse PDFs or generate course structures. The agent does that work. `@classroomio/mcp` only exposes tools, validates tool input, and forwards requests to the ClassroomIO API.

## Architecture

```text
Teacher / Admin
  |
  v
Claude Code / Codex / Cursor / OpenCode / other MCP client
  |
  | 1. Reads prompt, PDF, or existing course goal
  | 2. Produces or edits normalized course JSON
  v
@classroomio/mcp (stdio)
  |
  | 3. Sends authenticated tool calls
  |    Authorization: Bearer <cio_mcp_...>
  v
ClassroomIO API
  |
  | 4. Validates payloads
  | 5. Resolves the organization from the key
  | 6. Creates courses or applies changes to them directly
  v
ClassroomIO DB
```

## Transports

### stdio (this package)

`npx -y @classroomio/mcp` starts a local process for clients that can spawn one (Cursor, Claude Code, Codex, OpenCode). It authenticates with `CLASSROOMIO_API_KEY` and pins one organization for the life of the process. It is the only transport that registers `upload_video`, because that tool reads a file from the machine running the server.

### Streamable HTTP (hosted by the API)

Remote clients such as Claude and ChatGPT connect to `POST /mcp` on the ClassroomIO API (`https://mcp.classroomio.com` on ClassroomIO cloud, where the Cloudflare Worker maps `/` to `/mcp`). The endpoint is stateless and builds one server per request:

- **Authentication.** A request carries `Authorization: Bearer <credential>`, either an OAuth access token issued for the MCP resource or a `cio_mcp_...` automation key. A missing or invalid credential gets `401` with a `WWW-Authenticate` header that points at `/.well-known/oauth-protected-resource`, which starts the OAuth flow in the client. A credential that was not issued for MCP gets `403`.
- **Per-request identity.** Tool calls run in-process against the real `/public-api/v1` routes with the caller's own credential, so scopes, rate limits, plan limits and usage metering apply exactly as for a direct API call. There is no shared client.
- **Tools.** The same tools as stdio, without `upload_video`.
- **Accept header.** A missing or partial `Accept` header is treated as `application/json, text/event-stream`. Rejected requests (status 400 or above) are logged on the server.
- **Methods.** Only `POST` is accepted. `GET` and `DELETE` return `405` because the server never opens a stream or session.

The API imports `createMcpServer` and `ClassroomIoApiClient` from `@classroomio/mcp/server`. Importing the package root starts the stdio server, so never do that from another process.

## Principles

1. The agent owns reasoning.
2. The MCP package owns transport and input validation.
3. ClassroomIO API remains the trust boundary for auth, validation, and persistence.
4. New courses start unpublished, and only `publish_course` makes a course visible to students.
5. Agents write directly into the course; lesson version history lets the team review or undo changes to lesson content and blocks.

## Tool Surface

Current tools:

- `list_org_courses`
- `get_course_structure`
- `update_course_landing_page`
- `create_course`
- `publish_course`
- `unpublish_course`
- `tag_courses`
- `clone_course`
- `list_related_courses`
- `set_featured_courses`
- `list_tags`
- `create_tag`
- `update_tag`
- `create_tag_group`
- `update_tag_group`
- `set_course_tags`
- `list_course_members`
- `add_course_member`
- `enroll_course_student`
- `get_course_member`
- `update_course_member`
- `delete_course_member`
- `reset_course_member_progress`
- `get_course_member_analytics`
- `list_course_invites`
- `create_course_invite`
- `revoke_course_invite`
- `list_org_cohorts`
- `create_cohort`
- `get_cohort`
- `update_cohort`
- `delete_cohort`
- `list_cohort_members`
- `add_cohort_members`
- `update_cohort_member`
- `delete_cohort_member`
- `list_cohort_courses`
- `add_cohort_course`
- `remove_cohort_course`
- `list_cohort_newsfeed`
- `create_cohort_newsfeed_post`
- `update_cohort_newsfeed_post`
- `update_cohort_newsfeed_reaction`
- `delete_cohort_newsfeed_post`
- `list_cohort_newsfeed_comments`
- `create_cohort_newsfeed_comment`
- `delete_cohort_newsfeed_comment`
- `list_cohort_goals`
- `create_cohort_goal`
- `get_cohort_goal`
- `update_cohort_goal`
- `archive_cohort_goal`
- `delete_cohort_goal`
- `evaluate_cohort_goal`
- `evaluate_all_cohort_goals`
- `get_org_goals_overview`
- `list_my_cohort_goals`
- `list_my_enrolled_cohorts`
- `invite_students_to_cohort`
- `assign_students_to_cohort`
- `get_cohort_invite_link`
- `create_cohort_invite_link`
- `set_cohort_invite_link_revoked`
- `get_org_analytics`
- `list_compliance_learners`
- `get_learner_analytics`
- `get_course_analytics`
- `list_course_analytics_students`
- `list_audience_members`
- `get_audience_member`
- `add_audience_member`
- `assign_audience_courses`
- `update_audience_member`
- `remove_audience_member`
- `set_audience_status`
- `list_team_members`
- `get_team_member`
- `update_team_member`
- `invite_team_members`
- `remove_team_member`
- `get_team_invite_link`
- `set_team_invite_link`
- `get_organization`
- `update_organization`
- `get_organization_customization`
- `update_organization_customization`
- `list_email_templates`
- `get_email_template`
- `update_email_template`
- `reset_email_template`
- `send_test_email_template`
- `get_domain`
- `update_domain`
- `connect_custom_domain`
- `refresh_custom_domain`
- `remove_custom_domain`

Course certificate tools:

- `get_course_certificate`
- `update_course_certificate`
- `list_course_certificates`
- `download_course_certificate`

Certificate tools call the public API certificate endpoints. MCP keys get the `course:certificate:read` and `course:certificate:write` scopes by default. Existing MCP keys that still have the default scope set were given them too; a key created with a narrower scope list is left unchanged, so create a new key to use these tools. These scopes open only the certificate endpoints.

The tools act as the person who created the key, with the same permissions that person has in the dashboard. That role is checked on every call, so if the creator loses access, the key loses it too:

- Reading the certificate settings and design needs them to be a member of the course (including access through a program) or an org admin.
- Changing the settings or design, listing who earned the certificate, and downloading a certificate need them to be a course tutor/admin or an org admin.

`get_course_certificate` and `update_course_certificate` return effective settings: stored values with the dashboard's defaults filled in where nothing is stored (`isDownloadable` false, the default design, and so on).

`update_course_certificate` is a partial update: fields you leave out keep their values, and `null` clears `deadline` or `emailMessage`. `design` is replaced as a whole object, so read it first and send the full design. `deadline` must be an ISO 8601 datetime with a timezone, for example `2026-12-31T23:59:59Z`. Like the dashboard, it needs a paid plan: on the Basic (free) plan it fails with 403 `UPGRADE_REQUIRED`.

`list_course_certificates` lists the students who earned the course certificate, with when they earned it and when the certificate email was sent. It takes `page` and `limit` (default 20, max 100) and an optional `search` on name or email. `download_course_certificate` takes a `memberId` from that list and a `format` of `pdf` (default) or `png`.

What the tools cover compared with the dashboard:

- Covered: certificate settings and design, the list of students who earned the certificate, and downloading an issued certificate.
- Not covered, on purpose: previewing a design, which is a UI concern.
- Not covered yet: compliance certificate history. For compliance courses, the dashboard also shows each learner's cycle-by-cycle completion and recertification history. That belongs to a separate compliance API and is not part of these tools.
- Not covered because the dashboard does not have it: manual issuance. Certificates are issued automatically when a student meets the course's completion rules.

Course section, lesson and content tools:

- `list_course_sections`, `create_course_section`, `update_course_section`, `delete_course_section`
- `list_course_lessons`, `get_course_lesson`, `delete_course_lesson`, `notify_course_lesson_session_update`
- `list_lesson_blocks`, `add_lesson_block`, `attach_lesson_block`, `update_lesson_block`, `set_lesson_block_content`, `update_lesson_block_placement`, `move_lesson_block`, `remove_lesson_block`, `duplicate_lesson_block`
- `list_course_lesson_translations`, `set_course_lesson_translation` (these read and write the lesson's first note block)
- `list_course_lesson_history` (the text versions of every text block in one language, newest first, with `blockId` naming the block and `source` and `clientName` naming who made each change, such as Claude or ChatGPT; it does not include blocks being added, moved or removed, and there is no MCP restore or undo)
- `list_course_lesson_comments`, `create_course_lesson_comment`, `update_course_lesson_comment`, `delete_course_lesson_comment`
- `reorder_course_content`, `set_course_content_unlocked`, `delete_course_content`

They call `/public-api/v1/courses/:id/{sections,lessons,content}` with the key's `course:read` (reads) and `course:write` (everything else) scopes, which MCP keys have by default. Every tool, reads included, needs the key creator to be a course tutor/admin or an org admin.

- `create_course_section` with `moveUngrouped: true` moves every lesson and exercise without a section into the new section.
- `delete_course_section`, `delete_course_lesson` and `delete_course_content` are hard deletes. Deleting a section also deletes its lessons and exercises. If students have submissions or lesson completions in what you delete, they fail with 409 unless `force` is true, which deletes that work too.
- `reorder_course_content`, `set_course_content_unlocked` and `delete_course_content` are all or nothing: one id outside the course fails the whole call with 404.
- Comments are posted as the key creator. Only the author can edit a comment; the author or the course team can delete it.
- Lesson content is a list of blocks (notes, videos, slides, documents). A block can be reused in several lessons and editing it changes all of them; send the `version` you last read as `expectedVersion` so concurrent edits fail with 409 instead of overwriting each other. `required` and the watch threshold belong to a lesson's use of a block, not to the block.
- Creating and editing lessons and uploading videos use `create_lesson`, `update_lesson` and `upload_video`; the `videos` they take are video blocks. Restoring a lesson version is not covered.
- `update_lesson` also accepts `lessonAt`, the live-session start time as an ISO 8601 timestamp with a UTC offset (`null` clears it). Lessons created with `create_lesson` start with no date, and there is no field for the join link, so set that in the dashboard. Students see a live session, and get reminders, only when the lesson has both a date and a join link; reminders also need a published Live class course.

Course copy, related courses and landing page tools:

- `clone_course` calls `POST /public-api/v1/courses/:id/clone` with the `course:write` scope. The key creator must be an org admin or tutor and becomes the copy's tutor. The copy keeps the source's published state, and its exercise due dates are set to the time of copying. Templates are refused.
- `list_related_courses` calls `GET /public-api/v1/courses/:id/related` with the `course:read` scope. It returns published courses that share at least one tag with the course, most shared tags first, then newest, with the tags they share. Pass `profileId` to leave out courses that person is already in, `pricing` (`free` or `paid`) to filter by price, and `limit` (1–20, default 4). A course with no tags returns an empty list.
- `set_featured_courses` calls `PUT /public-api/v1/organization/landing-page/featured-courses` with the `organization:write` scope. The key creator must be an org admin. It sets the published courses (at most 4) shown first, in the order given, on the landing page and public course list. Other published courses still show after them, newest first. It replaces the current list; an empty list clears it.

MCP keys have both scopes by default.

Course exercise tools:

- `list_course_exercises`
- `get_course_exercise`
- `create_course_exercise`
- `update_course_exercise`
- `delete_course_exercise`
- `add_exercise_question`
- `update_exercise_question`
- `delete_exercise_question`
- `add_exercise_section`
- `update_exercise_section`
- `delete_exercise_section`
- `notify_course_exercise`
- `get_course_exercise_notify_status`
- `list_exercise_templates`
- `get_exercise_template`

Submission and marks tools:

- `list_course_submissions`
- `get_course_submission`
- `grade_course_submission`
- `update_course_submission`
- `delete_course_submission`
- `get_course_marks`

Exercise and template tools call the public API (`/public-api/v1/courses/:id/exercises` and `/public-api/v1/exercise-templates`) with the `course:exercise:read` / `course:exercise:write` scopes. Submission and marks tools call `/public-api/v1/courses/:id/submissions` and `/public-api/v1/courses/:id/marks` with the `course:submission:read` / `course:submission:write` scopes. MCP keys get all four by default. Existing MCP keys that still have the default scope set were given the submission scopes too; a key created with a narrower scope list is left unchanged, so create a new key to use the submission tools.

These tools act as the person who created the key:

- Every exercise, template, and submission tool needs them to be a course tutor/admin or an org admin (templates: an org admin or tutor). Exercise reads include the correct answers, which is why reading needs the team role too.
- `get_course_marks` needs them to be a member of the course or an org admin. A student only gets their own row, as in the dashboard.

`create_course_exercise` takes either `title` and `questions`, or a `templateId` from `list_exercise_templates`; with a template, only `sectionId`, `lessonId` and `order` may be sent alongside it. `create_course_exercise_from_template` was merged into it. `update_course_exercise` is a diff: send a question with its `id` to edit it, with `id` and `delete: true` to remove it, and without an `id` to add it; options work the same way. Question, option, and section ids must belong to the exercise. File upload, ordering, link, star rating, and video recording questions need a paid plan (403 `UPGRADE_REQUIRED` on Basic).

For one question or exercise section, use `add_exercise_question`, `update_exercise_question` and `delete_exercise_question`, or `add_exercise_section`, `update_exercise_section` and `delete_exercise_section`. They never delete anything you leave out. `delete_exercise_question` and `update_course_exercise` fail with 409 when they would delete a question students have answered, unless `force` is true, which also deletes their answers. In `update_course_exercise`, sections follow the same diff rules as questions: sections you leave out are kept. Exercise changes apply immediately, also on published courses, and past submissions are not regraded.

`delete_course_exercise` and `delete_course_submission` are hard deletes. Deleting an exercise also deletes every submission for it.

`grade_course_submission` sets the points per answer, the total, and feedback, and marks the submission completed. `update_course_submission` only changes the grading state or feedback. The student is emailed when the state changes, as in the dashboard. `notify_course_exercise` emails every course member and returns a `jobId` for `get_course_exercise_notify_status`; each call sends the emails again.

List tools (`list_course_exercises`, `list_exercise_templates`, `list_course_submissions`, `get_course_marks`) take `page` and `limit` (default 20, max 100) and return `{ data, pagination }`.

What the tools cover compared with the dashboard:

- Covered: creating, editing, deleting, and notifying about exercises (including exercise sections and templates), reviewing and grading submissions, and the gradebook.
- Not covered, on purpose: student actions (submitting an exercise, recording video answers). A key acts as its creator, an admin or tutor, and must not submit on a student's behalf.
- Covered by other tools: moving or reordering exercises (`reorder_course_content`) and unlocking one (`isUnlocked` on `update_course_exercise`).

Course template tools:

- `list_course_templates`
- `get_course_template`
- `create_course_from_template`
- `save_course_as_template`

They call `/public-api/v1/course-templates` and `/public-api/v1/courses/:id/template` with the `course:read` (reads) and `course:write` (writes) scopes, which MCP keys have by default. They act as the person who created the key, with the same rules as the dashboard:

- Listing and reading templates needs them to be an org admin or tutor.
- Creating a course from a template and saving a course as a template need them to be an org admin.

`list_course_templates` returns the organization's own templates first, then the curated global ones. Pass `source` (`all`, `org` or `global`) to narrow it; it takes `page` and `limit` (default 20, max 100) and returns `{ data, pagination }`. `get_course_template` returns the outline, item counts and the settings a new course starts with.

`create_course_from_template` copies the template's content and settings into a new unpublished course and adds the key creator to it as a tutor. `save_course_as_template` copies a course into a new unpublished template and leaves the course unchanged. It counts against the plan's template limit (Basic 1, Early Adopter 25, Enterprise unlimited) and fails with 403 `UPGRADE_REQUIRED` once that is reached.

What the tools cover compared with the dashboard:

- Covered: browsing and previewing templates, creating a course from one, and saving a course as a template. Saving a template again works as a duplicate.
- Not covered yet: converting a course into a template in place, and pulling template updates into courses made from it.

## Auth Model

The package expects an existing org-scoped ClassroomIO automation key. New MCP keys can no longer be created, so use the hosted server at `https://mcp.classroomio.com` unless you already have a key. The hosted server uses the permissions you approve when you sign in and your role in the workspace instead of key scopes.

The MCP process sends the key as a bearer token on every request.

ClassroomIO API:

1. hashes and verifies the key
2. resolves the owning organization
3. checks the key scopes
4. executes the requested action

The MCP package never decides permissions.

Course member and invite tools call the public API (`/public-api/v1/courses/:id/members`, `/public-api/v1/courses/:id/enrollments` and `/public-api/v1/courses/:id/invites`) and need the key's `course:member:read` / `course:member:write` scopes. The course tools call the public API too: `list_org_courses` and `get_course_structure` need `course:read`, and `create_course`, `publish_course` and `unpublish_course` need `course:write`, which MCP keys have by default. `update_course_landing_page` calls an internal endpoint with its own scopes. Both kinds count toward the same MCP rate limits. `list_course_members` takes the dashboard People page's filters and sort (`progress`, `membership`, `enrolledWithin`, `lastLoginBefore`, `certificateEarned`, `sortBy`, `sortOrder`).

Course member and invite tools act as the person who created the API key, with the same rule as the dashboard's People and Invites pages: the key creator must be a tutor/admin of the course or an org admin. Adding a member by `profileId` or email requires that person to already be in the organization; adding someone already in the course fails with 409. Adding a member by email, or enrolling one with `enroll_course_student`, fails with 409 `ORG_MEMBER_ARCHIVED` when that email belongs to an archived organization member; restore them in the dashboard first. `enroll_course_student` takes an email instead: it adds an existing organization student, invites someone new with a single-use invite, and changes nothing when the student is already enrolled or invited. It refuses admin and tutor emails with 409. Each new invite it creates counts toward the same 60-per-hour budget as `create_course_invite`.

Cohort tools call the public API (`/public-api/v1/cohorts/...`) and need the key's `cohort:read` (reads) and `cohort:write` (everything else) scopes, which MCP keys have by default. Analytics tools call `/public-api/v1/analytics/...` and `/public-api/v1/courses/{courseId}/analytics/...` and need `analytics:read`, also on by default. Audience and team tools call `/public-api/v1/audience/...` and `/public-api/v1/team/...` and need `audience:read` / `audience:write` and `team:read` / `team:write`, also on by default. Email template tools call `/public-api/v1/organization/email-templates/...` and need `organization:read` / `organization:write`, also on by default. Domain tools call `/public-api/v1/organization/domain/...` and need `organization:read` (reads) and `organization:domain:write` (everything else), also on by default. MCP keys don't get `public_api:*`, so the only public API routes they can reach are the course list and course create (`GET` and `POST /public-api/v1/courses`, with `course:read` and `course:write`), a course's structure (`GET /public-api/v1/courses/:id/structure`), a single course and its related courses (`GET /public-api/v1/courses/:id` and `/related`, with `course:read`), the identity route (`GET /public-api/v1/me`, no scope needed), publish and unpublish (`POST /public-api/v1/courses/:id/publish` and `/unpublish`, with `course:write`), the cohort, course member and invite, course certificate, course section, lesson and content, course clone, course template, course exercise and exercise template, course submission and marks, student activity, asset upload, analytics, audience, team, organization customization, email template, landing page and domain, and tag routes, plus a course update that sends only `tagIds` or `addTagIds`. `update_course_landing_page` calls an internal endpoint and uses its own scopes.

Cohort tools act as the person who created the API key and follow the same rules as the dashboard:

- Reads need the key creator to be a cohort member or an org admin.
- Other writes, including invites, invite links, and goal evaluation, need the key creator to be a cohort tutor/admin or an org admin.
- Posts, comments, and reactions are made as the key creator, so they also need the key creator to be a member of the cohort. A reaction only ever changes the key creator's own reaction.
- A comment can also be deleted by its author.
- `get_org_goals_overview` needs the key creator to be an org admin or tutor.
- `list_my_enrolled_cohorts` and `list_my_cohort_goals` return the key creator's own data in the key's organization.

`add_cohort_members` creates memberships directly and sends no email; `invite_students_to_cohort` is the dashboard invite flow (organization invites plus emails).

List tools (`list_org_cohorts`, `list_cohort_members`, `list_cohort_courses`, `list_cohort_goals`, `list_cohort_newsfeed_comments`, `list_my_enrolled_cohorts`, `list_my_cohort_goals`, `get_org_goals_overview`) take `page` and `limit` (default 20, max 100) and return `{ data, pagination }`. `list_cohort_newsfeed` is cursor-based: pass the returned `nextCursor` back as `cursor`. `list_org_cohorts` also takes `search`, `status`, `sortBy` and `sortOrder`; `list_cohort_members` takes `search`, `roleId`, `membership`, `lastLoginBefore`, `sortBy` and `sortOrder`, the same filters as the dashboard.

Audience and team tools act as the key creator:

- Every audience and team tool needs the key creator to be an org admin, the same as the dashboard's Audience and Team settings pages.
- `update_team_member` switches a member between admin and tutor with `roleId` (1 or 2). The key creator cannot change their own role, and the organization must keep at least one admin. Demoting an admin to tutor also revokes the OAuth connections they authorized in the organization, such as Zapier, and deletes the webhook subscriptions those connections created. When the role changes, the member is emailed the previous and new role and who changed it (not when the role is unchanged or the member has not joined yet).
- `update_audience_member` and `update_team_member` take `name`, `username`, `avatarUrl` and `locale` to change a joined member's profile, with the same rules as Settings → Profile, except that `avatarUrl` must be an http or https URL. A taken username is refused. The profile is shared, so a change shows in every organization that person belongs to, and the person is emailed which fields changed. Email and password stay with the person. On a member who has not accepted their invite yet, `update_audience_member` takes `email` to correct the address instead.
- `remove_audience_member` and `remove_team_member` delete the organization membership; the person keeps their account. The key creator cannot remove themselves, and the organization must keep at least one admin.
- `set_audience_status` calls `POST /public-api/v1/audience/bulk-status` to archive or unarchive up to 500 students by `memberIds` or `emails`, and needs `confirm: true`. Archived students lose course access and keep their progress; archiving also frees their plan seat. Unarchiving takes their seats back, and is refused with `UPGRADE_REQUIRED` when it would go over the plan's student limit. It returns one row per id or email: `changed`, `already_in_state` or `not_found`.
- When a tool call fails in the API, the result has `isError: true` and its text is JSON with the API's `error`, `code` (for example `UPGRADE_REQUIRED`), `status` and, for a validation error, `field`.
- `invite_team_members` sends the same invite emails as Settings → Teams. If an address belongs to a student, nothing is sent and `requiresConfirmation` is true; call again with those addresses in `confirmedStudentEmails` to promote them.
- `get_team_invite_link` and `set_team_invite_link` manage the reusable admin or tutor join link (`roleId` 1 or 2). `set_team_invite_link` with `enabled: true` returns the active link, creating a new one if the role's link is off; `enabled: false` turns it off.

- `list_audience_members` and `list_team_members` take `page` and `limit` (default 20, max 100) and return `{ data, pagination }`.

Organization tools call `GET` and `PATCH /public-api/v1/organization` with the `organization:read` and `organization:write` scopes. The key creator must be an org admin, the same as the dashboard's Organization settings page:

- `get_organization` returns the organization's `id`, `name`, `siteName`, `avatarUrl` (logo) and `theme`.
- `update_organization` takes any of `name` (at least 5 characters), `avatarUrl` (an http(s) image URL) and `theme` (`blue`, `rose`, `green`, `orange`, `purple`, or a `#RRGGBB` / `#RRGGBBAA` color). Omitted fields keep their values. The site name and custom domain can't be changed here.

LMS customization tools call `GET` and `PATCH /public-api/v1/organization/customization` with the same scopes and the same org admin rule, matching the dashboard's Customize LMS page:

- `get_organization_customization` returns `dashboard` (`community`, `exercise`, `bannerImage`, `bannerText`), `course` (`newsfeed`, `grading`), `apps` (`comments`) and `auth` (`backgroundImage`), with defaults filled in. Unset images are `null`.
- `update_organization_customization` takes any of those fields. Omitted fields keep their values. Images must be http(s) URLs, and `null` removes one. Setting `auth.backgroundImage` needs a paid plan or a self-hosted install (403 `UPGRADE_REQUIRED` otherwise); removing it doesn't. The language settings on that page aren't included.

Email template tools act as the key creator, who must be an org admin, the same as the dashboard's Emails settings page:

- `list_email_templates` returns every student email in one `locale` (default `en`) without its body. `get_email_template` returns the body, the allowed `variables`, and whether the email may link to `{{action_url}}`.
- `update_email_template` takes `content` and an optional `subject` (omit to keep it, `null` for the default). It rejects placeholders the email does not allow and removes unsafe HTML.
- `reset_email_template` deletes the saved version and returns the default. It succeeds even when nothing was saved.
- `send_test_email_template` sends up to 5 addresses a test with sample values. Without `content` or `subject` it tests the current template. The organization gets 5 test sends per 15 minutes, shared with the dashboard.
- Saving, resetting and test sends need a paid plan (403 `UPGRADE_REQUIRED` otherwise). Students only get a saved template on a paid plan, and a non-English one only when the organization enforces that language.

Domain tools act as the key creator, who must be an org admin, the same as the dashboard's Domains settings page:

- `get_domain` returns the subdomain (`siteName`), the site URL, the favicon and the connected custom domain with its last known `verified` state.
- `update_domain` changes `siteName` and/or `favicon` (`null` falls back to the logo). A new subdomain breaks every link to the old one.
- `connect_custom_domain` takes `hostname` and returns the DNS records to add. On ClassroomIO Cloud it needs a paid plan (403 `UPGRADE_REQUIRED`); self-hosted instances have no plan limit but return 409 `CUSTOM_DOMAIN_UNAVAILABLE` until Approximated is configured. To switch domains, remove the current one first.
- `refresh_custom_domain` checks DNS and SSL again; `remove_custom_domain` disconnects the domain on any plan. Both act only on the organization's own connected domain.

Analytics tools are read-only, cost no credits, and act as the key creator:

- `get_org_analytics` returns the sections picked with `include` (default `overview`): `overview`, `traffic`, `countries`, `funnel`, `courseTypes`, `topCourses`, `loginActivity`, `compliance`. It takes `days` (7, 30, 90 or 365; default 30) and `limit` (1-20, default 5) for list sections, and returns `{ data, meta }`.
- `get_org_analytics` and `get_learner_analytics` need the key creator to be an org admin or tutor. (The dashboard server lets any org member read these; the tools follow the dashboard UI, where only admins and tutors reach the analytics pages.) `loginActivity` and `compliance` need an org admin; for a tutor they are left out and listed in `meta.omitted`.
- `list_compliance_learners` needs an org admin.
- `get_course_analytics` (sections `summary`, `funnel`) and `list_course_analytics_students` need a course tutor/admin or an org admin.
- Each section is cached for up to 10 minutes (login activity: 24 hours); `meta.generatedAt` says when the oldest one was computed.
- `list_compliance_learners` takes `page` and `limit` (default 20, max 100); `list_course_analytics_students` caps `limit` at 50. Both return `{ data, pagination }`.

## Required Environment Variables

These settings, and the sections below that use them, apply only to this deprecated package.

- `CLASSROOMIO_API_URL`
- `CLASSROOMIO_API_KEY`
- `CLASSROOMIO_USER_AGENT` optional

## Run Locally

From the repo root:

```bash
pnpm build --filter=@classroomio/mcp
CLASSROOMIO_API_URL=http://localhost:3081 \
CLASSROOMIO_API_KEY=<cio_mcp_key> \
node packages/mcp/dist/index.js
```

Published package:

```bash
CLASSROOMIO_API_URL=https://api.classroomio.com \
CLASSROOMIO_API_KEY=<cio_mcp_key> \
npx -y @classroomio/mcp
```

## Client Setup

These examples use the deprecated local package with a key. To connect without a key, follow [Connect an MCP client](https://classroomio.com/docs/developers/mcp/setup).

### Claude Code

```bash
claude mcp add-json classroomio '{
  "command": "npx",
  "args": ["-y", "@classroomio/mcp"],
  "env": {
    "CLASSROOMIO_API_URL": "https://api.classroomio.com",
    "CLASSROOMIO_API_KEY": "<cio_mcp_key>"
  }
}'
```

### Codex

```bash
codex mcp add classroomio \
  --env CLASSROOMIO_API_URL=https://api.classroomio.com \
  --env CLASSROOMIO_API_KEY=<cio_mcp_key> \
  -- npx -y @classroomio/mcp
```

### OpenCode

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "classroomio": {
      "type": "local",
      "command": ["npx", "-y", "@classroomio/mcp"],
      "enabled": true,
      "environment": {
        "CLASSROOMIO_API_URL": "https://api.classroomio.com",
        "CLASSROOMIO_API_KEY": "<cio_mcp_key>"
      }
    }
  }
}
```

### Cursor

```json
{
  "mcpServers": {
    "classroomio": {
      "command": "npx",
      "args": ["-y", "@classroomio/mcp"],
      "env": {
        "CLASSROOMIO_API_URL": "https://api.classroomio.com",
        "CLASSROOMIO_API_KEY": "<cio_mcp_key>"
      }
    }
  }
}
```

## Authoring Model

Agents build and edit courses directly. `create_course` makes a new course that is unpublished, and every later tool (`create_course_section`, `create_lesson`, `add_lesson_block`, the exercise tools, `update_course_landing_page`) writes straight into that course. Changes to a lesson's content and blocks are saved in the lesson's version history (`list_course_lesson_history`), which is how the team reviews or undoes what an agent wrote there. Title, order and video changes made with `update_lesson` record no revision. Nothing is visible to students until `publish_course` runs.

Lesson authoring rule:

- lesson note content should contain only the lesson body HTML
- do not include the lesson title
- do not use `h1` or `h2` in lesson content
- start headings at `h3`
- ClassroomIO already renders the lesson title in the course UI

### Links to give the user

`create_course`, `publish_course` and `unpublish_course` each return two links:

- `appUrl`: the dashboard page where the team edits the course. Hand this one to the user while the course is unpublished.
- `landingPageUrl`: the public landing page. It is `null` until the course is published; hand it to the user only once it is not null.

### Course banner

`create_course` adds a banner by default, picked from an Unsplash search on the course title (it needs `UNSPLASH_API_KEY` on the server). Pass `bannerImageUrl` to use your own image (any public image URL works, including Unsplash photo URLs), `bannerImageQuery` to change the search text, or `generateBannerImage: false` for no banner. The `banner` field in the result says whether one was applied (`applied`, `imageUrl`, `source`) and, when not, why (`reason`: `not_requested`, `unsplash_not_configured`, `no_image_found` or `lookup_failed`). A lookup failure never blocks course creation. `update_course_landing_page` takes the same choices as `imageUrl`, `generateImage` and `imageQuery`. There is no image upload tool; `upload_video` handles video only.

### Publishing

`publish_course` and `unpublish_course` act as the key creator, who must be a course tutor/admin or an org admin; `create_course` needs an org admin or tutor. `publish_course` runs the go-live readiness check first. A course needs a title, description, landing page overview, description, goals and requirements, a banner, at least one lesson or exercise, content in every lesson, and questions in every exercise (plus a completion deadline for compliance courses). When something is missing the course stays unpublished and the result lists `blockers`, which `update_course_landing_page` and the lesson tools can fix. `published` in the result is the outcome, and `unpublish_course` hides the course again.

## User Flows

### Flow 1: Create a new course from a prompt

User says:

```text
Create a complete course on exponential functions for high school students.
```

Expected tool sequence:

1. Agent plans the course.
2. Agent calls `create_course`.
3. Agent calls `create_course_section`, `create_lesson`, `add_lesson_block` and the exercise tools to fill it.
4. Agent calls `update_course_landing_page` for the overview, goals and requirements.
5. Agent gives the user the `appUrl` to review the course.
6. When the user asks to publish, agent calls `publish_course` and gives the user the `landingPageUrl`.

Result:

- the course exists and stays unpublished until step 6
- sections, lessons and localized lesson content are written directly into the course
- the course has a banner unless none could be found, as the `banner` field reports

### Flow 2: Update a landing page with AI-generated copy and media

User says:

```text
Rewrite this course landing page to feel more premium, generate a new cover image, and add three believable reviews.
```

Expected tool sequence:

1. Agent calls `list_org_courses` if it needs to resolve the course ID by name first.
2. Agent calls `update_course_landing_page`.

What the landing-page tool can update:

- title
- short description
- overview
- requirements
- goals
- pricing fields
- instructor section
- reviews
- landing page image

The tool can either:

- use an explicit `imageUrl`
- or generate a random Unsplash-based image with `generateImage` and `imageQuery`

### Flow 3: Turn a PDF into a course

User says:

```text
I have my course in a PDF. Extract it and turn it into a ClassroomIO course.
```

Expected tool sequence:

1. Agent reads the PDF itself.
2. Agent calls `create_course`.
3. Agent adds sections, lessons and exercises with `create_course_section`, `create_lesson`, `add_lesson_block` and the exercise tools.
4. User reviews the course through the `appUrl`.
5. Agent revises with the same tools if needed.
6. Agent calls `publish_course` when the user approves.

Important:

- the PDF does not need to be uploaded to MCP
- the agent sends the content as tool input

### Flow 4: Tag courses

User says:

```text
Add tags for algebra, beginner, and exponential growth to this course.
```

Expected tool sequence:

1. Agent calls `tag_courses` with the course id and the tag names.

Result:

- missing tags are created in ClassroomIO
- the tags are added to the course, keeping its existing tags unless `mode` is `replace`

### Flow 5: Update an existing course

User says:

```text
Take my existing Algebra course, reorganize it, and rewrite the lesson content for a beginner audience.
```

Expected tool sequence:

1. Agent calls `list_org_courses` if it needs to resolve the course ID from the course name first.
2. Agent calls `get_course_structure` with the existing `courseId`.
3. Agent changes the course with `reorder_course_content`, `update_lesson`, the lesson block tools and the exercise tools.
4. The team reviews or undoes lesson content and block changes through the lesson version history.

The changes apply to the course as it is, so a published course stays published while the agent edits it.

### Flow 6: Reorder course content

User says:

```text
Move the quiz before lesson 2 and put the recap lesson into the last section.
```

Expected tool sequence:

1. Agent calls `reorder_course_content`.

Courses with grouping enabled can mix sections and standalone lessons or exercises. Sections and standalone items share one top-level `order`; items within a section have their own sibling order. Pass `sectionId: null` to move an item outside its section. Omitted fields retain their current values. Include sections and items in one request to save a mixed reorder atomically.

### Flow 7: Add exercises to a course

User says:

```text
Add a 5-question multiple-choice exercise to lesson 3.
```

Expected tool sequence:

1. Agent calls `list_course_exercises` if it needs current context.
2. Agent calls `create_course_exercise` for a brand new exercise, or with a `templateId` from `list_exercise_templates`.
3. Agent calls `get_course_exercise`, then `update_course_exercise` for later revisions.
4. Agent calls `notify_course_exercise` if the user wants students emailed.

## Input Contract Notes

Tagging tools use:

- `tagNames`: human-readable tag names, not tag IDs
- `mode: "merge" | "replace"`
- `groupName` optional, defaults to `Automation`

Missing tags are created automatically. `tag_courses` uses the public API: it reads tags from `/public-api/v1/tags`, matches them by name ignoring case, creates any that are missing, then calls `PUT /public-api/v1/courses/{courseId}` for each course: with `addTagIds` in merge mode, so the server adds them and calls on the same course cannot drop each other's tags, or with `tagIds` in replace mode. It needs `course:read` and `course:tag:write`, which MCP keys have by default, and the key creator must be an org admin. Each course it tags costs one credit, plus one for each tag or group it has to create. Each course is a separate write, so if one fails (for example on the rate limit), the courses before it keep their tags and the error lists which courses were tagged and which were not.

The other tag tools map one-to-one to the public tag endpoints: `list_tags` (free, needs `course:read` and an org-member key creator), and `create_tag`, `update_tag`, `create_tag_group`, `update_tag_group` and `set_course_tags` (one credit each, need `course:tag:write` and an org-admin key creator). `set_course_tags` replaces a course's tags with the ids you send, so `[]` removes them all.

Exercise tools write directly into the course:

- `list_course_exercises`
- `get_course_exercise`
- `create_course_exercise`
- `update_course_exercise`
- `delete_course_exercise`
- `add_exercise_question`
- `update_exercise_question`
- `delete_exercise_question`
- `add_exercise_section`
- `update_exercise_section`
- `delete_exercise_section`

Supported `questionTypeId` values for exercise payloads:

- `1` `RADIO` - Single answer
- `2` `CHECKBOX` - Multiple answers
- `3` `TEXTAREA` - Paragraph
- `4` `TRUE_FALSE` - True/False (factual statements; options: True, False; auto-graded)
- `5` `SHORT_ANSWER` - Short answer
- `6` `NUMERIC` - Numeric answer
- `7` `FILL_BLANK` - Fill in the blank
- `8` `FILE_UPLOAD` - File upload
- `9` `ORDERING` - Ordering
- `10` `LINK` - Links
- `11` `WORD_BANK` - Word bank
- `12` `STAR` - Star rating
- `13` `VIDEO_RECORDING` - Video recording
- `14` `THUMBS` - Thumbs up/down (open-ended poll with customizable Yes/No labels; no correct answer)

`TRUE_FALSE` is auto-graded with `settings.correctValue` (boolean) and fixed True/False labels for factual statements. `THUMBS` is open-ended (not auto-graded): two customizable Yes/No-style options with thumbs icons for sentiment or poll-style questions — do not set `settings.correctValue`. `MATCHING` and `HOTSPOT` are disabled and must not be used.

## Recommended Agent Behavior

Read the course with `get_course_structure` before editing it, change only the affected items with the direct tools, and leave publishing to `publish_course` when the user asks for it. Lesson content and block changes are saved in version history, so a wrong edit to them can be reviewed and undone there.
