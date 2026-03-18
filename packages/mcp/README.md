# @classroomio/mcp

Thin stdio MCP server for ClassroomIO course authoring.

The package does not parse PDFs or generate course structures. The agent does that work. `@classroomio/mcp` only exposes tools, validates tool input, and forwards requests to the ClassroomIO API.

## Architecture

```text
Teacher / Admin
  |
  v
Claude Code / Codex / Cursor / other MCP client
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
- `list_course_exercises`
- `get_course_exercise`
- `create_course_exercise`
- `create_course_exercise_from_template`
- `update_course_exercise`
- `update_course_draft`
- `tag_course_draft`
- `tag_courses`
- `publish_course_draft`
- `publish_course_draft_to_existing_course`

## Auth Model

The package expects an org-scoped ClassroomIO automation key generated from `Automation -> MCP` in the ClassroomIO dashboard.

The MCP process sends the key as a bearer token on every request.

ClassroomIO API:

1. hashes and verifies the key
2. resolves the owning organization
3. checks the key scopes
4. executes the requested action

The MCP package never decides permissions.

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
- do not include the lesson title or a top-level heading that repeats `lessons[].title`
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

### Flow 6: Add exercises to a live course

User says:

```text
Add a 5-question multiple-choice exercise to lesson 3.
```

Expected tool sequence:

1. Agent calls `list_course_exercises` if it needs current context.
2. Agent calls `create_course_exercise` for a brand new exercise.
3. Agent calls `update_course_exercise` for later revisions.

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
- `create_course_exercise_from_template`
- `update_course_exercise`

Supported `questionTypeId` values for exercise payloads:

- `1` `RADIO` - Single answer
- `2` `CHECKBOX` - Multiple answers
- `3` `TEXTAREA` - Paragraph
- `4` `TRUE_FALSE` - True/False
- `5` `SHORT_ANSWER` - Short answer
- `6` `NUMERIC` - Numeric answer
- `7` `FILL_BLANK` - Fill in the blank
- `8` `FILE_UPLOAD` - File upload
- `9` `MATCHING` - Matching
- `10` `ORDERING` - Ordering
- `11` `HOTSPOT` - Hotspot
- `12` `LINK` - Links

## Operational Notes

- `create_course_draft_from_course` may add warnings if a live course uses legacy lesson notes instead of localized lesson content
- if a course has ungrouped lessons, the seeded draft may add a synthetic `Ungrouped` section so the structure stays valid
- published drafts are treated as finalized snapshots

## Recommended Agent Behavior

For small edits, an agent can still read the course structure and modify only the affected items in the draft.

For broad revisions, prefer this sequence:

1. `get_course_structure`
2. `create_course_draft_from_course`
3. `update_course_draft`
4. `publish_course_draft_to_existing_course`

That keeps major AI-assisted edits reviewable and explicit.
