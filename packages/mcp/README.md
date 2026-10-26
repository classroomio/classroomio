# @classroomio/mcp

Thin stdio MCP server for ClassroomIO course authoring.

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
  | 6. Creates drafts or applies changes to a course
  v
ClassroomIO DB
```

## Principles

1. The agent owns reasoning.
2. The MCP package owns transport and input validation.
3. ClassroomIO API remains the trust boundary for auth, validation, and persistence.
4. Draft creation and publish are separate operations.
5. Updating an existing course is done through a seeded draft, not blind writes to the live course.

## Tool Surface

Current tools:

- `list_org_courses`
- `get_course_structure`
- `update_course_landing_page`
- `create_course_draft`
- `create_course_draft_from_course`
- `get_course_draft`
- `update_course_draft`
- `tag_course_draft`
- `tag_courses`
- `clone_course`
- `set_featured_courses`
- `publish_course_draft`
- `publish_course_draft_to_existing_course`
- `list_course_members`
- `add_course_member`
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
- `list_team_members`
- `get_team_member`
- `update_team_member`
- `list_email_templates`
- `get_email_template`
- `update_email_template`
- `reset_email_template`
- `send_test_email_template`

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
- `list_course_lesson_translations`, `set_course_lesson_translation`, `list_course_lesson_history`
- `list_course_lesson_comments`, `create_course_lesson_comment`, `update_course_lesson_comment`, `delete_course_lesson_comment`
- `reorder_course_content`, `set_course_content_unlocked`, `delete_course_content`

They call `/public-api/v1/courses/:id/{sections,lessons,content}` with the key's `course:read` (reads) and `course:write` (everything else) scopes, which MCP keys have by default. Every tool, reads included, needs the key creator to be a course tutor/admin or an org admin.

- `create_course_section` with `moveUngrouped: true` moves every lesson and exercise without a section into the new section.
- `delete_course_section`, `delete_course_lesson` and `delete_course_content` are hard deletes. Deleting a section also deletes its lessons and exercises. If students have submissions or lesson completions in what you delete, they fail with 409 unless `force` is true, which deletes that work too.
- `reorder_course_content`, `set_course_content_unlocked` and `delete_course_content` are all or nothing: one id outside the course fails the whole call with 404.
- Comments are posted as the key creator. Only the author can edit a comment; the author or the course team can delete it.
- Creating and editing lessons and uploading videos use `create_lesson`, `update_lesson` and `upload_video`. Restoring a lesson version is not covered.

Course copy and landing page tools:

- `clone_course` calls `POST /public-api/v1/courses/:id/clone` with the `course:write` scope. The key creator must be an org admin or tutor and becomes the copy's tutor. The copy keeps the source's published state, and its exercise due dates are set to the time of copying. Templates are refused.
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

The package expects an org-scoped ClassroomIO automation key generated from `Automation -> MCP` in the ClassroomIO dashboard.

The MCP process sends the key as a bearer token on every request.

ClassroomIO API:

1. hashes and verifies the key
2. resolves the owning organization
3. checks the key scopes
4. executes the requested action

The MCP package never decides permissions.

Course member and invite tools call the public API (`/public-api/v1/courses/:id/members` and `/public-api/v1/courses/:id/invites`) and need the key's `course:member:read` / `course:member:write` scopes. The course draft tools above call internal-only endpoints and use their own scopes (`course_import:draft:*`, `course:read`/`write`, etc.). Both kinds count toward the same MCP rate limits.

Course member and invite tools act as the person who created the API key, with the same rule as the dashboard's People and Invites pages: the key creator must be a tutor/admin of the course or an org admin. Adding a member by `profileId` or email requires that person to already be in the organization; adding someone already in the course fails with 409.

Cohort tools call the public API (`/public-api/v1/cohorts/...`) and need the key's `cohort:read` (reads) and `cohort:write` (everything else) scopes, which MCP keys have by default. Analytics tools call `/public-api/v1/analytics/...` and `/public-api/v1/courses/{courseId}/analytics/...` and need `analytics:read`, also on by default. Audience and team tools call `/public-api/v1/audience/...` and `/public-api/v1/team/...` and need `audience:read` / `audience:write` and `team:read` / `team:write`, also on by default. Email template tools call `/public-api/v1/organization/email-templates/...` and need `organization:read` / `organization:write`, also on by default. MCP keys don't get `public_api:*`, so the only public API routes they can reach are the cohort, course member and invite, course certificate, course section, lesson and content, course clone, course template, course exercise and exercise template, course submission and marks, student activity, asset upload, analytics, audience, team, and organization email template and landing page routes. The course/draft tools above call other, internal-only endpoints and use their own scopes.

Cohort tools act as the person who created the API key and follow the same rules as the dashboard:

- Reads need the key creator to be a cohort member or an org admin.
- Other writes, including invites, invite links, and goal evaluation, need the key creator to be a cohort tutor/admin or an org admin.
- Posts, comments, and reactions are made as the key creator, so they also need the key creator to be a member of the cohort. A reaction only ever changes the key creator's own reaction.
- A comment can also be deleted by its author.
- `get_org_goals_overview` needs the key creator to be an org admin or tutor.
- `list_my_enrolled_cohorts` and `list_my_cohort_goals` return the key creator's own data in the key's organization.

`add_cohort_members` creates memberships directly and sends no email; `invite_students_to_cohort` is the dashboard invite flow (organization invites plus emails).

List tools (`list_org_cohorts`, `list_cohort_members`, `list_cohort_courses`, `list_cohort_goals`, `list_cohort_newsfeed_comments`, `list_my_enrolled_cohorts`, `list_my_cohort_goals`, `get_org_goals_overview`) take `page` and `limit` (default 20, max 100) and return `{ data, pagination }`. `list_cohort_newsfeed` is cursor-based: pass the returned `nextCursor` back as `cursor`.

Audience and team tools act as the key creator:

- Every audience and team tool needs the key creator to be an org admin, the same as the dashboard's Audience and Team settings pages.
- `update_team_member` switches a member between admin and tutor with `roleId` (1 or 2). The key creator cannot change their own role, and the organization must keep at least one admin.
- `update_audience_member` and `update_team_member` take `name` to set a joined member's full name. The profile is shared, so the name changes in every organization that person belongs to. Email, password, username and avatar stay with the person. On a member who has not accepted their invite yet, `update_audience_member` takes `email` to correct the address instead.
- `remove_audience_member` deletes the organization membership; the person keeps their account. Inviting and removing team members is not available yet.
- `list_audience_members` and `list_team_members` take `page` and `limit` (default 20, max 100) and return `{ data, pagination }`.

Email template tools act as the key creator, who must be an org admin, the same as the dashboard's Emails settings page:

- `list_email_templates` returns every student email in one `locale` (default `en`) without its body. `get_email_template` returns the body, the allowed `variables`, and whether the email may link to `{{action_url}}`.
- `update_email_template` takes `content` and an optional `subject` (omit to keep it, `null` for the default). It rejects placeholders the email does not allow and removes unsafe HTML.
- `reset_email_template` deletes the saved version and returns the default. It succeeds even when nothing was saved.
- `send_test_email_template` sends up to 5 addresses a test with sample values. Without `content` or `subject` it tests the current template. The organization gets 5 test sends per 15 minutes, shared with the dashboard.
- Saving, resetting and test sends need a paid plan (403 `UPGRADE_REQUIRED` otherwise). Students only get a saved template on a paid plan, and a non-English one only when the organization enforces that language.

Analytics tools are read-only, cost no credits, and act as the key creator:

- `get_org_analytics` returns the sections picked with `include` (default `overview`): `overview`, `traffic`, `countries`, `funnel`, `courseTypes`, `topCourses`, `loginActivity`, `compliance`. It takes `days` (7, 30, 90 or 365; default 30) and `limit` (1-20, default 5) for list sections, and returns `{ data, meta }`.
- `get_org_analytics` and `get_learner_analytics` need the key creator to be an org admin or tutor. (The dashboard server lets any org member read these; the tools follow the dashboard UI, where only admins and tutors reach the analytics pages.) `loginActivity` and `compliance` need an org admin; for a tutor they are left out and listed in `meta.omitted`.
- `list_compliance_learners` needs an org admin.
- `get_course_analytics` (sections `summary`, `funnel`) and `list_course_analytics_students` need a course tutor/admin or an org admin.
- Each section is cached for up to 10 minutes (login activity: 24 hours); `meta.generatedAt` says when the oldest one was computed.
- `list_compliance_learners` takes `page` and `limit` (default 20, max 100); `list_course_analytics_students` caps `limit` at 50. Both return `{ data, pagination }`.

## Required Environment Variables

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

## Draft Model

A draft is a saved, structured course proposal. It is not the live course.

Draft payload shape:

```text
draft
  course
  tags[]
  sections[]
  lessons[]
  lessonLanguages[]
  warnings[]
  sourceReferences[] optional
  exercises[] optional
```

Drafts support:

- review before publish
- iterative edits from the agent
- safer updates to existing courses
- auditability of AI-generated structure

Lesson authoring rule:

- `lessonLanguages[].content` should contain only the lesson body HTML
- do not include the lesson title
- do not use `h1` or `h2` in lesson content
- start headings at `h3`
- ClassroomIO already renders the lesson title in the course UI

## After Publish

Once a draft has been published, the live course becomes the safer source of truth.

Recommended agent rule:

- if the draft is still `DRAFT`, continue editing that draft
- if the draft is `PUBLISHED`, do not keep reusing it for major follow-up edits
- instead, read the live course and create a fresh draft from that course

Recommended post-publish sequence:

1. `get_course_structure`
2. `create_course_draft_from_course`
3. `update_course_draft`
4. `publish_course_draft_to_existing_course`

Why:

- teachers may edit the live course in the UI after publish
- another agent session may have changed the course
- reusing an old published draft can overwrite newer live changes

For exercises on an already-published course, prefer the direct exercise tools instead of creating a whole new draft when the user only wants to add or revise exercises.

## User Flows

### Flow 1: Create a new course from a prompt

User says:

```text
Create a complete course on exponential functions for high school students.
```

Expected tool sequence:

1. Agent plans the course.
2. Agent calls `create_course_draft`.
3. User asks for revisions.
4. Agent calls `update_course_draft`.
5. User approves.
6. Agent calls `publish_course_draft`.

Result:

- a new course is created
- sections and lessons are created
- localized lesson content is written
- publish returns the live `courseId` and public `courseUrl`
- publish can optionally set a random Unsplash-derived course cover

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

### Flow 3: Create a draft from a PDF

User says:

```text
I have my course in a PDF. Extract it and turn it into a ClassroomIO course draft.
```

Expected tool sequence:

1. Agent reads the PDF itself.
2. Agent restructures the content into normalized JSON.
3. Agent calls `create_course_draft`.
4. User reviews the draft.
5. Agent calls `update_course_draft` if needed.
6. User approves.
7. Agent calls `publish_course_draft`.

Important:

- the PDF does not need to be uploaded to MCP
- the MCP package only receives structured JSON

### Flow 4: Tag a draft before publish

User says:

```text
Add tags for algebra, beginner, and exponential growth to this draft.
```

Expected tool sequence:

1. Agent calls `tag_course_draft`.
2. User reviews the updated draft tags.
3. Agent later calls `publish_course_draft`.

Result:

- the draft stores tag names
- publish ensures the tags exist in ClassroomIO
- publish assigns those tags to the live course

### Flow 5: Update an existing course safely

User says:

```text
Take my existing Algebra course, reorganize it, and rewrite the lesson content for a beginner audience.
```

Expected tool sequence:

1. Agent calls `list_org_courses` if it needs to resolve the course ID from the course name first.
2. Agent calls `get_course_structure` with the existing `courseId`.
3. Agent optionally calls `create_course_draft_from_course` to persist a seeded draft.
4. Agent updates the draft with the new structure and content using `update_course_draft`.
5. User reviews the changes.
6. Agent calls `publish_course_draft_to_existing_course`.

What this publish does today:

- updates the existing course title, description, type, and metadata
- can set a generated course cover from Unsplash
- returns the public `courseUrl`
- updates existing sections when the draft keeps their IDs
- updates existing lessons when the draft keeps their IDs
- creates new sections and lessons for draft items without matching live IDs
- upserts lesson language content
- merges draft tags into the existing course

### Flow 6: Reorder live course content

User says:

```text
Move the quiz before lesson 2 and put the recap lesson into the last section.
```

Expected tool sequence:

1. Agent calls `reorder_course_content`.

Use this direct path when the live course only needs section ordering or lesson or exercise moves between sections.
It avoids the full draft round-trip for simple structural changes.

Courses with grouping enabled can mix sections and standalone lessons or exercises. Sections and standalone items share one top-level `order`; items within a section have their own sibling order. Pass `sectionId: null` to move an item outside its section. Omitted fields retain their current values. Include sections and items in one request to save a mixed reorder atomically.

### Flow 7: Add exercises to a live course

User says:

```text
Add a 5-question multiple-choice exercise to lesson 3.
```

Expected tool sequence:

1. Agent calls `list_course_exercises` if it needs current context.
2. Agent calls `create_course_exercise` for a brand new exercise, or with a `templateId` from `list_exercise_templates`.
3. Agent calls `get_course_exercise`, then `update_course_exercise` for later revisions.
4. Agent calls `notify_course_exercise` if the user wants students emailed.

Use this direct path when the course is already live and the change is exercise-specific.

What it does not do today:

- automatically delete sections or lessons that are absent from the draft
- automatically delete lesson locales that are absent from the draft

That behavior is intentional. The current update path is non-destructive by default.

## How Existing-Course Updates Work

When a draft is seeded from a live course:

- section `externalId` values are the real section IDs
- lesson `externalId` values are the real lesson IDs

As long as the agent preserves those IDs while editing the draft, publish-to-existing-course can map draft items back to the live records and update them safely.

If the agent adds a brand new section or lesson, it should assign a new synthetic `externalId`. ClassroomIO will create that record on publish.

## Input Contract Notes

For large updates, the agent should:

1. call `get_course_structure`
2. keep existing `externalId` values for records it wants to update
3. only generate new `externalId` values for new records
4. avoid deleting records from the draft unless the user explicitly wants omitted content to remain untouched

Publish input also supports:

- `bannerImageUrl`: use this exact course cover
- `bannerImageQuery`: search Unsplash with this query
- `generateBannerImage`: fetch a random Unsplash image using the course title or query

Tagging tools use:

- `tagNames`: human-readable tag names, not tag IDs
- `mode: "merge" | "replace"`
- `groupName` optional, defaults to `Automation`

The API creates missing tags automatically when needed.

Exercise tools use the live course directly:

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

## Operational Notes

- `create_course_draft_from_course` may add warnings if a live course uses legacy lesson notes instead of localized lesson content
- lessons and exercises outside any section stay at the top level of the draft: a lesson without `sectionExternalId` and an exercise with neither a section nor a lesson share one 1-based `order` sequence with the sections
- published drafts are treated as finalized snapshots

## Recommended Agent Behavior

For small edits, an agent can still read the course structure and modify only the affected items in the draft.

For broad revisions, prefer this sequence:

1. `get_course_structure`
2. `create_course_draft_from_course`
3. `update_course_draft`
4. `publish_course_draft_to_existing_course`

That keeps major AI-assisted edits reviewable and explicit.
