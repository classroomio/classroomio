# AI Course Assistant

## Status

- Done (shipped)

## Purpose

Deliver an AI assistant inside the course UI that teachers can use to:

- **Upload a document** (PDF/DOCX) and have the AI propose a full course structure
- **Review a course plan** with sections, lessons, and short descriptions before any content is created
- **Execute the plan** — the agent creates sections, lessons, and populates content automatically
- **Update content**: "Rewrite the introduction paragraph to be more engaging"
- **Generate questions**: "Given this lesson, come up with 5 MCQ questions"
- **Draft lessons**: Ask the agent to write the initial draft of a lesson

The assistant has two modes:

- **Plan Mode** — AI analyzes input (document or prompt) and proposes a course structure. The teacher reviews, edits, and approves before anything is created.
- **Agent Mode** — AI executes approved actions: creating sections, lessons, exercises, and populating content. Shows real-time progress.

## Goals

- Help teachers go from a source document to a fully structured course in minutes
- Operate strictly within the current org/course context (no cross-org access)
- Integrate natively with existing ClassroomIO services (sections, lessons, exercises, content)
- Give teachers full control — always review before destructive or bulk actions

## Non-Goals (v1)

- Student-facing AI (teachers/admins only)
- Cross-course or cross-org operations
- Custom model selection or fine-tuning
- Real-time collaboration (multi-user editing via agent)
- Internet/web search from the agent

---

## Architecture Overview

### Execution Model: Hybrid (Client Context + API Writes)

The client already has course content loaded in Svelte stores when the teacher is on a page. The agent:

- **Reads context from the client** — current lesson text, exercise questions, course structure are passed with each message. No extra API calls to "read" content.
- **Writes through the API** — all mutations route through existing service functions with the full middleware stack (`authMiddleware` -> `orgMemberMiddleware` -> `courseTeamMemberMiddleware`). Permission enforcement, single source of truth, and auditability for free.
- **Previews before bulk changes** — Plan Mode shows the full proposed structure before creating anything. For individual edits, the agent presents changes for review before applying.

### Agent Architecture: Tool-Calling Pattern

The agent uses LLM function/tool calling:

```
Teacher -> Chat UI -> Agent API -> LLM -> tool_call -> Existing Services -> result -> LLM -> streamed response -> Chat UI
```

The LLM sees a set of **tools** (mapped to existing service functions) and decides which to call based on the teacher's message. The agent API executes the tool with full permission checks, then feeds the result back to the LLM for a human-friendly summary.

### SDK: Vercel AI SDK

- `ai` — core (`streamText`, `tool`, types) — in `packages/ai-assistant` and `apps/api`
- `@ai-sdk/svelte` — Svelte 5 `Chat` class (runes-based, matches project's `LessonApi` / `BaseApiWithErrors` pattern)
- `@ai-sdk/openai` + `@ai-sdk/anthropic` + `@ai-sdk/google` — provider packages
- `streamText()` returns `toUIMessageStreamResponse()` which works directly as a Hono response
- Tool calling is built-in with Zod schemas; SDK handles function-calling protocol, multi-step execution, streaming tool results
- Provider abstraction lets us swap between OpenAI, Google, and Anthropic per request via the dashboard model picker

---

## Plan Mode & Agent Mode

The two modes represent different phases of a workflow, not a toggle. A typical flow:

### Plan Mode

**Trigger**: Teacher uploads a document or asks the agent to design a course structure.

**What happens**:

1. Teacher uploads a PDF/DOCX (or pastes text, or describes a topic)
2. Agent parses the document, extracts text content
3. Agent analyzes the content and generates a **course plan** — a structured proposal:

```json
{
  "title": "Introduction to Biology",
  "sections": [
    {
      "title": "Cell Biology",
      "order": 1,
      "lessons": [
        {
          "title": "Cell Structure and Function",
          "description": "Overview of cell organelles, their roles, and how they work together",
          "order": 1,
          "hasExercise": true
        },
        {
          "title": "Cell Division: Mitosis and Meiosis",
          "description": "The processes of cell division, their stages, and biological significance",
          "order": 2,
          "hasExercise": true
        }
      ]
    }
  ]
}
```

4. The chat UI renders this as a **structured plan view** — a tree with sections and lessons, each showing title and description
5. Teacher can:
   - **Approve as-is**: "Looks good, implement it"
   - **Request changes**: "Add a section on genetics" / "Merge the first two lessons" / "Remove the exercise from lesson 3"
   - **Edit inline**: Modify titles/descriptions directly in the plan view
   - **Reject**: "Start over with a different structure"
6. The agent refines the plan based on feedback (still in Plan Mode)
7. Once approved, transitions to Agent Mode

**Key constraint**: Plan Mode is purely conversational. Nothing is created in the database until the teacher explicitly approves.

### Agent Mode

**Trigger**: Teacher approves a plan, or asks the agent to perform a specific action (create lesson, update content, generate questions).

**What happens for plan execution**:

A typical plan with 4 sections and 12 lessons needs ~40+ tool calls (create section + create lesson + write content + create exercise for each). This exceeds what a single `streamText()` call can handle in one pass. Plan execution uses a **sequential multi-round approach**:

1. Agent receives the approved plan
2. The first `streamText()` round creates all sections and the first few lessons (within `maxSteps: 15`)
3. When `maxSteps` is reached, the `onFinish` callback automatically sends a continuation message: "Continue implementing the plan from where you left off"
4. The agent sees the conversation history (including tool results from prior rounds) and picks up where it stopped
5. This repeats until the plan is fully executed
6. Each round checks the token balance before starting — if tokens run out mid-plan, the agent stops cleanly and reports what was completed

Within each round, the agent:
- Creates sections first (in order), capturing the returned section IDs
- Creates lessons within each section (in order), capturing lesson IDs
- For each lesson, generates full content based on the source document + lesson description, then calls `update_lesson_content` to populate it
- Optionally creates exercises with generated questions for lessons marked `hasExercise`

**What happens for individual actions** (update lesson, generate questions, etc.):

Same as the standard agent flow — LLM decides which tool to call, executes it, streams the result. Single-round, `maxSteps: 15` is sufficient.

**Progress tracking**: During plan execution, the agent emits structured progress events that the UI renders as a checklist. This persists across multi-round execution:

```
[x] Section 1: Cell Biology (created)
[x]   Lesson 1: Cell Structure and Function (created)
[x]   Lesson 1: Content written (2,400 words)
[ ]   Lesson 1: Exercise (5 questions) — in progress...
[ ]   Lesson 2: Cell Division
[ ] Section 2: Genetics
```

### Partial Failure & Resume

Plan execution can fail partway through — tokens run out, LLM rate limit, network error, or teacher hits Stop. When this happens:

- **Already-created content is kept.** Sections and lessons created before the failure exist in the database and are visible in the course content tree.
- **The progress card shows what was completed vs. what remains.** Completed items have checkmarks; the failed/stopped item shows an error or stop icon; remaining items show empty circles.
- **The teacher can resume.** After the failure, the chat shows a "Resume" button. Clicking it sends a message: "Continue implementing the plan." The agent calls `get_course_structure` to see what already exists, compares it against the plan, and picks up from the first uncreated item.
- **Token exhaustion is explicit.** If the failure was due to running out of tokens, the progress card shows: "Paused — token limit reached. [Buy more credits] or wait for reset on [date]." The plan state is preserved in the conversation — the teacher can resume after purchasing credits or next month.

### Existing Course Content

Before executing a plan, the agent checks if the course already has content via `get_course_structure`. If sections or lessons already exist:

- The agent reports what it found: "This course already has 3 sections and 8 lessons."
- It asks the teacher how to proceed: **"Should I add the new content after the existing sections, or would you like to start fresh?"**
- **Append** (default): new sections are created with `order` values starting after the last existing section. Existing content is untouched.
- **Start fresh**: the agent warns that this is destructive ("This will not delete existing content, but the new sections will be added alongside it. You can remove old content manually."). In v1, the agent cannot delete content — it can only append. Deletion tools are added in Phase 4.

### Token Cost Estimation

Before executing a plan, the agent estimates the token cost and warns the teacher:

- The estimate is based on plan size: `(sectionCount * ~500) + (lessonCount * ~3,000) + (exerciseCount * ~1,500)` tokens per item (rough heuristic based on typical generation lengths + tool call overhead)
- Displayed in the plan card before "Implement Plan": *"Estimated cost: ~45,000 tokens (9% of your monthly allowance)"*
- If the estimate exceeds 50% of remaining tokens: stronger warning — *"This plan will use a significant portion of your remaining tokens (estimated ~45,000 of 62,000 remaining). Proceed?"*
- This is a best-effort estimate, not a guarantee. Actual usage varies based on content complexity.

### Mode Detection

The mode is implicit based on context, not explicitly toggled by the user:

- If the agent is analyzing a document or proposing structure -> **Plan Mode** behavior (present plan, wait for approval)
- If the agent is executing a tool or the user said "implement it" -> **Agent Mode** behavior (execute and report)
- Regular chat (explain something, answer a question about the course) -> neither mode, just conversation

The system prompt instructs the LLM on when to propose vs. when to execute.

---

## Document Upload & Parsing

### Plan Gating: EARLY_ADOPTER+ Only

Document upload is a premium feature — only available to orgs on the **EARLY_ADOPTER** plan or higher. BASIC (free) plan users cannot upload documents.

**Client-side behavior**:
- The attachment icon in the chat input is visible to all teachers (so they discover the feature)
- When a BASIC plan user clicks it, the file picker does NOT open. Instead, the **upgrade modal** is triggered immediately (same `openUpgradeModal()` pattern used by certificates, team invites, etc.)
- For EARLY_ADOPTER+ users, the file picker opens normally

**Server-side enforcement**:
- `POST /agent/upload` checks the org's plan before processing
- If the org is on the BASIC plan, the endpoint returns `403 { error: "document_upload_requires_upgrade", upgradeRequired: true }`
- The client handles this 403 by calling `openUpgradeModal()`
- This double-gating (client + server) prevents bypassing the restriction

### File Size Limit

Maximum upload size: **5MB** (aligns with the existing `MAX_DOCUMENT_SIZE` constant in `apps/api/src/constants/upload.ts`).

- Server validates file size before parsing. Files over 5MB are rejected with `413 { error: "file_too_large", maxSize: 5242880 }`
- Client validates before upload as well (check `file.size` on selection) and shows an inline error: "File is too large. Maximum size is 5MB."
- 5MB is sufficient for most textbook chapters, syllabi, and course outlines. Full textbook PDFs (50MB+) are out of scope — teachers should upload individual chapters.

### One Document Per Conversation

Only one document can be uploaded per conversation. If the teacher uploads a second file, it replaces the first — the previous `documentId` in Redis is deleted and the new one takes its place. This keeps the context simple and avoids confusion about which document the agent is referencing. If a teacher needs to combine multiple sources, they should merge them into one document before uploading.

### Upload Flow

1. Teacher clicks the attachment icon in the chat input
2. **Plan check**: if BASIC plan, trigger upgrade modal and stop. If EARLY_ADOPTER+, continue.
3. Selects a PDF, DOCX, or PPTX file
4. **Size check**: if file > 5MB, show inline error and stop
5. File is uploaded to `POST /agent/upload` which:
   - Validates plan (EARLY_ADOPTER+ required)
   - Validates file type (PDF/DOCX/PPTX only) and size (max 5MB)
   - Extracts text content server-side
   - **Truncates** extracted text to a maximum of 100,000 characters (~75K tokens) to stay within LLM context limits. If truncated, the response includes `truncated: true` so the UI can show: "Document was large — only the first portion was analyzed."
   - Returns `{ documentId, fileName, pageCount, textPreview, truncated }` (first ~200 chars for preview)
   - Stores extracted text in Redis with a TTL (keyed by `documentId`, expires after 1 hour)
6. The `documentId` is attached to the next chat message
7. When the agent processes the message, it retrieves the full extracted text from Redis and includes it in the LLM context

### Supported File Types & Text Extraction

**PDF**: Use `pdf-parse` (lightweight, pure JS, no native dependencies). Extracts text content from all pages. Handles multi-column layouts reasonably well for structured content like textbooks/syllabi.

**DOCX**: Use `mammoth` (pure JS). Extracts text content preserving heading structure (H1, H2, etc.) which helps the LLM understand document hierarchy for course structure generation.

**PPTX**: Use `pptx-parser` (pure JS). Extracts text from slides, preserving slide order as a natural section boundary. Slide titles become potential lesson titles; slide body text becomes content context. This covers the common case of teachers converting existing slide decks into courses.

### Why Server-Side Extraction

- Keeps document parsing out of the client bundle
- Text is extracted once and cached in Redis — subsequent agent turns reference the same extracted text without re-uploading
- The LLM never sees the raw binary file — only clean text, which is more token-efficient
- File validation and size limits are enforced server-side

### Upload API

```
POST /agent/upload
  Content-Type: multipart/form-data
  Body: file (PDF, DOCX, or PPTX, max 5MB)
  Auth: authMiddleware + orgMemberMiddleware + courseTeamMemberMiddleware
  Plan: EARLY_ADOPTER+ required (BASIC returns 403)

  Success Response (200): {
    documentId: string,
    fileName: string,
    mimeType: string,
    pageCount: number | null,    // PDF and PPTX (slide count)
    wordCount: number,
    textPreview: string,          // first ~200 chars
    truncated: boolean            // true if text exceeded 100K char limit
  }

  Error Responses:
    403: { error: "document_upload_requires_upgrade", upgradeRequired: true }  // BASIC plan
    413: { error: "file_too_large", maxSize: 5242880 }                         // > 5MB
    415: { error: "unsupported_file_type", allowed: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation"] }
```

The extracted text is NOT returned in the upload response (it can be very large). It lives in Redis and is fetched internally by the agent chat endpoint when `documentId` is provided in the chat message.

### Redis Key

```
agent:document:{documentId} -> { text, fileName, mimeType, uploadedAt }
TTL: 3600 seconds (1 hour)
```

Uses the existing Redis infrastructure (`apps/api/src/utils/redis/`).

---

## Package: `packages/ai-assistant`

A thin, backend-focused package consumed by `apps/api`. No UI code. The heavy lifting is done by the Vercel AI SDK; this package provides project-specific configuration on top.

### Responsibilities

- **Provider factory** — creates the right AI SDK `LanguageModel` for a given provider (`createModel`); `getProviderConfigForProvider(provider)` reads the per-provider key (`OPENAI_API_KEY` / `GOOGLE_API_KEY` / `ANTHROPIC_API_KEY`); `pickAnyConfiguredProvider()` returns the first provider with a key set, used by the status route and title generation
- **Role-aware tool registry** — `getToolSchemas(role)` returns Zod schemas per role
- **Role-aware system prompt** — `buildSystemPrompt(context)` generates different LLM instructions for teachers vs students, including Plan Mode vs Agent Mode behavior
- **Course plan types** — `CoursePlan`, `CoursePlanSection`, `CoursePlanLesson` types used by both API and dashboard
- **Shared types** — `AgentRole`, `AgentContext`, tool names, config types

### Structure

```
packages/ai-assistant/
  src/
    index.ts                 # Public exports
    types.ts                 # AgentRole, AgentContext, CoursePlan, AIProviderConfig
    providers/
      index.ts               # createModel(config) factory
    tools/
      index.ts               # getToolSchemas(role) registry
      shared.ts              # Read-only tool schemas (both roles)
      teacher.ts             # Mutation tool schemas (teacher only, v1)
      student.ts             # Learning tool schemas (student only, v2 stubs)
    prompt/
      system-prompt.ts       # buildSystemPrompt(context) — role-aware
      teacher.ts             # Teacher prompt template (includes Plan/Agent mode instructions)
      student.ts             # Student prompt template (v2 stub)
  package.json
  tsconfig.json
```

The agent loop itself is NOT in this package — `streamText()` from `ai` core handles the full loop (prompt -> LLM -> tool call -> execute -> respond -> repeat). The Hono route assembles tools (schema from package + execute from services) and calls `streamText`.

---

## Foundation Layer: Role-Aware Design

### AgentRole — the core discriminator

- `'teacher'` — can read AND mutate course content (create sections, update lessons, generate questions, execute plans)
- `'student'` — can only read and discuss content (explain concepts, answer questions, quiz on material). Gated off in v1.

### Role detection — server-side, automatic

- API route checks user's course membership via existing `isCourseTeamMemberOrOrgAdmin`
- Team members (ADMIN/TUTOR role in `groupmember`) get `role: 'teacher'`
- Regular members (STUDENT role) get `role: 'student'`
- In v1, `role: 'student'` returns 403

### Tool registry — `getToolSchemas(role)`

- `shared` tools (read-only): available to both roles
- `teacher` tools (mutations): teacher only — includes section/lesson creation, content updates, plan execution
- `student` tools (v2): student only, stubs for now

Teachers get `shared + teacher`. Students get `shared + student`. Students can never access mutation tools, even via prompt injection.

### Single API endpoint

`/agent/chat` serves both roles. Role is detected server-side (not passed by the client, preventing spoofing). The endpoint loads tools and prompt based on the detected role.

---

## Agent Tools

### V1 Core Tools (9 tools)

| Tool                    | Type  | Description                                          | Service                                               |
| ----------------------- | ----- | ---------------------------------------------------- | ----------------------------------------------------- |
| `get_course_structure`  | read  | Get sections, lessons, exercises tree                | `getCourseContentItems` + `listCourseSections`        |
| `get_lesson_content`    | read  | Get a specific lesson's content (HTML)               | `getLesson` + lesson language query                   |
| `get_exercise_details`  | read  | Get exercise with all questions and options          | `getExercise`                                         |
| `create_section`        | write | Create a new section in the course                   | `createCourseSection(courseId, { title, order })`     |
| `create_lesson`         | write | Create a new lesson in a section                     | `createLesson(courseId, { title, sectionId, order })` |
| `update_lesson_content` | write | Update lesson text content                           | `upsertLessonLanguageService(lessonId, { locale, content })` |
| `create_exercise`       | write | Create exercise with questions and options           | `createExercise({ courseId, lessonId, sectionId, title, questions })` |
| `add_questions`         | write | Add questions to an existing exercise                | `updateExerciseService` (diff-based)                  |
| `generate_course_plan`  | agent | Analyze text and return structured CoursePlan JSON   | No service call — LLM generates the plan structure    |

**Note on `generate_course_plan`**: This is a special tool. Unlike other tools that call services, this tool's "execution" is the LLM itself generating a structured JSON response conforming to the `CoursePlan` schema. The tool schema defines the output format so the LLM returns valid, parseable JSON rather than free-form text. The chat UI detects this tool's result and renders the plan view component.

### Phase 2+ Tools

**Lessons**: `update_lesson_metadata`, `delete_lesson`, `reorder_lessons`
**Sections**: `update_section`, `reorder_sections`, `delete_section`
**Exercises**: `update_exercise_metadata`, `update_question`, `delete_question`, `delete_exercise`
**Other**: `update_course_tags`, `create_newsfeed_post`

### Phase 4 Student Tools (v2)

`explain_concept`, `quiz_me`, `clarify_exercise`, `get_my_progress`, `get_my_submissions`

### Tool Execution Rules

Each tool handler in the API will:

1. Extract IDs from tool arguments
2. Verify the target resource belongs to the course/org in context
3. Verify user is course team member or org admin
4. Check token balance before LLM call (see Token Usage section)
5. Call the existing service function
6. Return structured result to the agent

### No-Hallucination Boundary

The system prompt includes an explicit list of what the agent CANNOT do. The agent must **never**:

- Pretend to perform an action it doesn't have a tool for
- Fabricate data it hasn't retrieved via a tool call
- Claim to have made a change unless a tool call succeeded
- Create content without presenting it for review first (in Plan Mode)

**Explicit CANNOT-do list (included verbatim in system prompt):**

- Cannot create, delete, or clone courses
- Cannot update course-level settings (title, description, logo, status)
- Cannot manage course members, invitations, or roles
- Cannot grade submissions or assign marks
- Cannot handle payments or attendance
- Cannot upload files, images, videos, or documents to lessons (the agent can receive documents for analysis, but cannot attach media to course content)
- Cannot delete sections, lessons, or exercises (v1 — added in Phase 2)
- Cannot reorder content (v1 — added in Phase 2)
- Cannot manage org settings, members, or billing
- Cannot access data from other courses or organizations
- Cannot browse the internet or fetch external URLs
- Cannot send emails or notifications

---

## Locale Detection

`upsertLessonLanguageService` requires a `locale` parameter. The agent determines the locale as follows:

1. **Check existing course content first.** If the course already has lessons with content in a specific locale (e.g., lessons with `lesson_language` rows in `fr`), use that locale. This ensures consistency with existing content.
2. **If the course is empty**, default to `en`.
3. **For document uploads**, the agent does NOT auto-detect the document's language. The content is generated in the course's locale regardless of the source document language. If a teacher uploads a French textbook but the course is in English, the agent generates English content based on the French source material. This is a feature, not a bug — teachers often want to create courses in a different language than their source material.
4. **The teacher can override.** If they say "Write the content in Spanish," the agent uses `es`. The system prompt instructs: "Default to the course's existing locale. If the teacher requests a specific language, use that locale instead."

Supported locales match the existing `lesson_language.locale` enum: `en`, `hi`, `fr`, `pt`, `de`, `vi`, `ru`, `es`, `pl`, `da`.

---

## Lesson Content Format

The lesson editor uses **TipTap** (ProseMirror-based) and expects `HTMLContent` — standard HTML that TipTap can parse. The agent must generate content that renders correctly in the editor.

### Allowed HTML Tags

The system prompt includes explicit formatting guidance:

```
When generating lesson content, use only these HTML elements:
- <h2>, <h3> for section headings (never <h1> — that's the lesson title)
- <p> for paragraphs
- <ul><li> for unordered lists, <ol><li> for ordered lists
- <strong> for bold, <em> for italic
- <blockquote> for callouts or important notes
- <code> for inline code, <pre><code> for code blocks
- <a href="..."> for links (only if referencing a specific URL the teacher provided)

Do NOT use: <div>, <span>, <table>, <img>, <iframe>, <script>, <style>,
or any custom elements. Content is sanitized before storage — unsupported
tags will be stripped.
```

This aligns with TipTap's default schema and the existing `sanitizeHtml()` / `sanitizeOptionalHtml()` functions used throughout the codebase.

### Content Length Guidance

The system prompt includes guidance on lesson length:

```
When writing lesson content:
- Aim for 800-2,000 words per lesson (roughly 3-8 minutes reading time)
- Use headings to break content into scannable sections
- Include practical examples where relevant
- For plan execution: match the depth to the lesson description — a lesson
  described as "brief overview" should be shorter than one described as
  "deep dive into..."
```

---

## Token-Based Usage Tracking

AI usage is metered by tokens. Each org gets a monthly base allowance from their plan, with the option to buy extra credit packs when exhausted.

### How It Works

1. **Before LLM call**: check `ai_token_usage` for current month + `ai_credit_balance`. If `remaining <= 0`, return 402.
2. **After LLM call**: `streamText()` result exposes `usage` with `promptTokens` and `completionTokens`. Insert row into `ai_token_usage`.
3. **Deduction logic**: monthly allowance consumed first. Credits only touched when `used_this_month > allowance`.

### Plan-Based Allowances

Tied to existing `organization_plan` table. Each plan gets a monthly token allowance and feature access:

| Plan | Token Allowance | Chat | Document Upload |
|------|----------------|------|-----------------|
| **BASIC** | 0 tokens | Not available | Not available — triggers upgrade modal |
| **EARLY_ADOPTER** | 500K tokens/month (~50-100 conversations) | Available | Available (max 5MB per file) |
| **ENTERPRISE** | 2M tokens/month (or unlimited) | Available | Available (max 5MB per file) |

Allowance resets on the 1st of each month.

Document upload is gated by plan, not by token balance. Even if an EARLY_ADOPTER has tokens remaining, a BASIC user still cannot upload. This is a feature gate, not a usage gate.

### Extra Credit Packs

- One-time purchases, do NOT expire, do NOT reset monthly
- Deduction order: monthly allowance first, then credits
- Purchase flow: org settings -> payment -> credits added to `ai_credit_balance`

### Database Tables

```sql
CREATE TABLE ai_token_usage (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id        UUID NOT NULL REFERENCES organization(id),
  user_id       UUID NOT NULL,
  course_id     UUID NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens  INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  model         TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_token_usage_org_month ON ai_token_usage (org_id, created_at);

CREATE TABLE ai_credit_balance (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id        UUID NOT NULL REFERENCES organization(id) UNIQUE,
  balance       INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Safeguards

Four layers:

1. **Route-level middleware** — `authMiddleware` + `orgMemberMiddleware` + `courseMemberMiddleware`. Role detection inside handler.
2. **Tool-level permission checks** — tool set IS the security boundary. Students cannot call mutation tools. Each tool's execute function re-verifies resource ownership.
3. **Token budget enforcement** — every LLM call checks remaining balance. 402 if exhausted.
4. **Rate limiting** — per-user, per-org rate limits (requests/minute). Self-hosted is uncapped.

---

## Observability: Tinybird Event Tracking

Agent actions are tracked via **Tinybird** — a real-time analytics backend for high-volume event data. This keeps observability data out of the main Postgres database and provides instant SQL-based querying for debugging and analytics.

### Why Tinybird (not Postgres)

- Agent events are **append-only, high-volume** — every tool call, every conversation turn generates an event. This is analytics workload, not transactional.
- The main Postgres DB should not carry this load. Token usage tracking (`ai_token_usage` table) stays in Postgres because it's used for balance enforcement (transactional). Observability events go to Tinybird.
- Tinybird provides **real-time ingestion** via HTTP API and **instant SQL querying** — investigate issues within seconds of them happening.
- Dashboards and alerts can be built on top without custom infrastructure.

### Events to Track

| Event | When | Key Fields |
|-------|------|------------|
| `agent.chat.started` | Chat request received | `orgId`, `userId`, `courseId`, `role`, `hasDocument`, `messageCount` |
| `agent.chat.completed` | Stream finished | `orgId`, `userId`, `courseId`, `promptTokens`, `completionTokens`, `model`, `durationMs`, `toolCallCount` |
| `agent.chat.error` | LLM or service error | `orgId`, `userId`, `courseId`, `errorCode`, `errorMessage`, `model` |
| `agent.tool.called` | Tool execution starts | `orgId`, `userId`, `courseId`, `toolName`, `toolArgs` (sanitized) |
| `agent.tool.completed` | Tool execution finishes | `orgId`, `userId`, `courseId`, `toolName`, `success`, `durationMs`, `resultSummary` |
| `agent.tool.failed` | Tool execution errors | `orgId`, `userId`, `courseId`, `toolName`, `errorCode`, `errorMessage` |
| `agent.document.uploaded` | Document parsed | `orgId`, `userId`, `courseId`, `mimeType`, `fileSize`, `wordCount`, `truncated` |
| `agent.plan.generated` | Course plan proposed | `orgId`, `userId`, `courseId`, `sectionCount`, `lessonCount` |
| `agent.plan.executed` | Plan execution completed | `orgId`, `userId`, `courseId`, `sectionsCreated`, `lessonsCreated`, `exercisesCreated`, `durationMs`, `completedFully` |

### Ingestion Pattern

Events are sent to Tinybird via its **Events API** (`POST https://api.tinybird.co/v0/events`). The API fires events asynchronously (fire-and-forget) — agent performance is never blocked by analytics.

```typescript
// Thin wrapper in apps/api/src/utils/tinybird.ts
async function trackAgentEvent(eventName: string, data: Record<string, unknown>) {
  if (!TINYBIRD_TOKEN) return; // Skip silently when not configured (self-hosted)
  fetch(`${TINYBIRD_BASE_URL}/v0/events?name=${eventName}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TINYBIRD_TOKEN}` },
    body: JSON.stringify({ ...data, timestamp: new Date().toISOString() })
  }).catch(() => {}); // Fire-and-forget, never block the agent
}
```

### Environment Variables

- `TINYBIRD_TOKEN` — Tinybird API token for event ingestion
- `TINYBIRD_BASE_URL` — Tinybird API base URL (default: `https://api.tinybird.co`)

When not configured (self-hosted, or dev environments), events are silently skipped. No errors, no impact on functionality.

### What This Enables

- **Debugging**: "Teacher X says the AI created wrong content" -> query `agent.tool.called` and `agent.tool.completed` events for that user + course to see exactly which tools fired and what arguments were passed
- **Usage analytics**: aggregate tool call frequency, popular actions, average conversation length per org
- **Error monitoring**: track `agent.chat.error` and `agent.tool.failed` rates by model, tool, or org
- **Plan execution monitoring**: track `agent.plan.executed` to see completion rates, average plan sizes, how often teachers modify vs. accept plans as-is
- **Cost analysis**: correlate token usage with tool call patterns to understand what drives cost

---

## Self-Hosted vs Cloud

- **Cloud**: AI assistant enabled by default. ClassroomIO provides the LLM API key server-side. Usage metered per plan tier.
- **Self-hosted**: AI assistant **disabled by default**. To enable, admin sets at least one of `OPENAI_API_KEY`, `GOOGLE_API_KEY`, or `ANTHROPIC_API_KEY`. The dashboard model picker exposes Gemini 2.5 Flash (Google) and GPT-4o (OpenAI); each option requires its own provider key. Anthropic is supported in code but not exposed in the picker. The assistant button is hidden when no provider key is set. No token metering for self-hosted (user's own API key, their cost).

---

## UI Specification

### Trigger

"AI Assistant" button in the course sidebar navigation. In v1, only visible to teachers/admins. Hidden when self-hosted and no AI key configured.

### Panel

Right sidebar using `@cio/ui` Sheet (`side="right"`, ~420px). Does NOT replace the left sidebar — both can be open simultaneously.

### Chat Interface

- Message list with user/assistant turns
- Text input at bottom with send button and **attachment icon** (for PDF/DOCX upload)
- Streaming token display (ChatGPT-like typing)
- Quick-action chips (context-dependent)
- Stop button while streaming

### File Upload in Chat

- Attachment icon next to the text input (paperclip icon)
- **BASIC plan users**: clicking the attachment icon triggers the upgrade modal (`openUpgradeModal()`). File picker does not open. A subtle tooltip or label can hint "Upgrade to upload documents".
- **EARLY_ADOPTER+ users**: clicking opens file picker filtered to `.pdf, .docx, .pptx`
- **Client-side size check**: if selected file exceeds 5MB, show inline error below the input: "File is too large. Maximum size is 5MB." File is not uploaded.
- Selected file shows as a chip above the input: `[Biology-Textbook.pdf (24 pages)] [x]`
- On send, file is uploaded first (`POST /agent/upload`), then `documentId` is included in the chat message
- While uploading: chip shows spinner. While parsing: "Analyzing document..."
- If server returns 403 (`document_upload_requires_upgrade`): trigger upgrade modal
- After parsing: agent enters Plan Mode and proposes a course structure

### Plan View Component

When the agent returns a `generate_course_plan` tool result, the chat renders a **plan card** instead of plain text:

```
+------------------------------------------+
| Course Plan                              |
|                                          |
| Section 1: Cell Biology                  |
|   1. Cell Structure and Function         |
|      Overview of cell organelles...      |
|   2. Cell Division: Mitosis & Meiosis    |
|      The processes of cell division...   |
|                                          |
| Section 2: Genetics                      |
|   3. DNA and Gene Expression             |
|      Structure of DNA, transcription...  |
|   4. Heredity and Genetic Variation      |
|      Mendelian genetics, Punnett...      |
|                                          |
| [Implement Plan]  [Ask for Changes]      |
+------------------------------------------+
```

- Sections are collapsible
- Each lesson shows title + short description
- "Implement Plan" button -> triggers Agent Mode execution
- "Ask for Changes" button -> focuses the text input with a prompt to describe changes
- Teacher can also just type feedback naturally: "Add a section on ecology"

### Agent Mode Progress

During plan execution, a progress card replaces the plan card:

```
+------------------------------------------+
| Implementing Course Plan                 |
|                                          |
| [x] Section: Cell Biology                |
|   [x] Lesson: Cell Structure             |
|   [x] Content written (1,850 words)      |
|   [x] Exercise: 5 MCQ questions          |
|   [~] Lesson: Cell Division              |
|   [ ] Content                            |
|   [ ] Exercise                           |
| [ ] Section: Genetics                    |
|   [ ] Lesson: DNA and Gene Expression    |
|   [ ] Lesson: Heredity                   |
|                                          |
| Creating lesson content...               |
| [Stop]                                   |
+------------------------------------------+
```

- Checkmarks for completed steps
- Spinner for in-progress step
- Empty circles for pending steps
- Stop button to halt execution (already-created content is kept)

### Role-Aware Quick Actions

Teacher (v1):
- "Upload a document to create a course"
- "Draft a lesson"
- "Generate questions from this lesson"
- "Improve this lesson's text"

Student (v2):
- "Explain this lesson"
- "Quiz me on this topic"
- "Help me with this exercise"

### Context Awareness

Client passes `courseId`, current `lessonId` or `exerciseId`. The role is NOT sent from the client — detected server-side. The system prompt includes: "The teacher is currently viewing lesson/exercise ID: {id}".

### Store Refresh

`onFinish` callback fires after the agent completes. Refreshes the relevant store:
- After plan execution: full course content tree refresh
- After lesson update: `lessonApi.get()` reload
- After exercise creation/update: exercise data reload

---

## Streaming

The Vercel AI SDK provides structured SSE via `toUIMessageStreamResponse()`:

- Text chunks (tokens stream one by one)
- Tool call events (when LLM decides to call a tool)
- Tool results (when tool execution completes)
- Finish signals

On the frontend, the `Chat` class from `@ai-sdk/svelte` consumes this protocol automatically. No manual SSE parsing.

---

## API Routes

New route domain: `/agent`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| `GET` | `/agent/status` | Feature flag + role + usage info | auth + orgMember |
| `POST` | `/agent/chat` | Main chat endpoint (SSE stream) | auth + orgMember + courseMember |
| `POST` | `/agent/upload` | Upload PDF/DOCX/PPTX for parsing (EARLY_ADOPTER+ only) | auth + orgMember + courseTeamMember |
| `GET` | `/agent/usage` | Detailed usage stats | auth + orgMember |
| `POST` | `/agent/credits` | Purchase credits | auth + orgAdmin |

### POST /agent/chat

```typescript
{
  courseId: string,
  messages: UIMessage[],      // Vercel AI SDK message format
  context?: {
    lessonId?: string,
    exerciseId?: string,
    documentId?: string        // References uploaded document in Redis
  }
}
```

Returns: SSE stream (`toUIMessageStreamResponse()`)

Flow:
1. Detect role from course membership
2. Check token balance
3. If `documentId` provided, fetch extracted text from Redis and inject into context
4. Load tools + system prompt based on role
5. Call `streamText()` with `maxSteps: 15`. Plan execution uses multi-round continuation (see Plan Mode section).
6. Stream response to client
7. Record token usage after completion

### POST /agent/upload

```typescript
// Request: multipart/form-data with 'file' field
// Response:
{
  documentId: string,
  fileName: string,
  mimeType: string,
  pageCount: number | null,
  wordCount: number,
  textPreview: string
}
```

Registered in `apps/api/src/app.ts` as `.route('/agent', agentRouter)`.

---

## LLM Provider Abstraction

Per-provider API keys configure which models are available:

- `OPENAI_API_KEY` — enables GPT-4o (and `gpt-4o-mini` for title generation)
- `GOOGLE_API_KEY` — enables Gemini 2.5 Flash
- `ANTHROPIC_API_KEY` — enables Claude (Sonnet 4.5 / Haiku for titles); supported in code, not in the picker UI
- `TINYBIRD_TOKEN` — Tinybird API token for event ingestion (optional; events silently skipped when not set)
- `TINYBIRD_BASE_URL` — Tinybird API base URL (default: `https://api.tinybird.co`)

The dashboard model picker (above the chat input) is persisted per browser in `localStorage` under `classroomio-ai-chat-model`. Each chat request sends a `model` field; `apps/api/src/routes/agent/chat.ts` looks it up in `AGENT_MODELS` (`packages/utils/src/agent-models`) to resolve provider + backend model id, then 503s with `AI_NOT_CONFIGURED` if that provider's key is missing. Anthropic stays in `AGENT_MODELS` so backend code keeps working; it's gated out of the UI by the `UI_PICKER_MODEL_IDS` subset.

Provider factory in `packages/ai-assistant` normalizes into a single `LanguageModel` instance for `streamText()`.

---

## Conversation Persistence

**v1**: Session-scoped — managed in-memory by the `Chat` class on the client. Conversation resets when sidebar closes or teacher navigates away.

**v2 consideration**: Persist conversations per course in the database.

---

## Example Flows

### Flow 1: Upload Document -> Plan -> Execute

The core differentiating flow. Teacher has a textbook PDF and wants to turn it into a course.

1. Teacher opens AI Assistant, clicks attachment icon, selects `Biology-101.pdf`
2. File uploads to `/agent/upload`. Chat shows: `[Biology-101.pdf (142 pages)]`
3. Teacher sends: "Create a course structure from this textbook"
4. Agent receives the message + extracted text from Redis
5. **Plan Mode**: Agent analyzes the document structure (chapters, headings, key topics) and calls `generate_course_plan` tool, returning a structured `CoursePlan`
6. Chat renders the plan card with sections and lessons
7. Teacher reviews: "Looks good but split the genetics section into two — basic and advanced"
8. Agent refines the plan, returns updated `CoursePlan`
9. Teacher clicks "Implement Plan"
10. **Agent Mode**: Agent executes the plan step by step:
    - `create_section("Cell Biology", 1)` -> sectionId
    - `create_lesson(courseId, { title: "Cell Structure", sectionId, order: 1 })` -> lessonId
    - `update_lesson_content(lessonId, { locale: "en", content: "<generated HTML>" })` -> success
    - `create_exercise({ courseId, lessonId, sectionId, title: "Cell Structure Quiz", questions: [...] })` -> exerciseId
    - ... repeat for each lesson in each section
11. Progress card updates in real-time
12. On completion: "Course structure created with 4 sections and 12 lessons. Content has been populated for all lessons."
13. Course content tree refreshes — teacher sees the full course

### Flow 2: "Generate 5 MCQ questions from this lesson"

Teacher is viewing a lesson and opens the AI assistant.

1. Teacher sends: "Generate 5 multiple choice questions from this lesson"
2. Context includes `lessonId`
3. LLM calls `get_lesson_content(lessonId)` to read the lesson text
4. LLM generates 5 questions
5. LLM calls `create_exercise({ courseId, lessonId, sectionId, title, questions })` or `add_questions(exerciseId, questions)` if an exercise already exists
6. Chat shows tool status cards + summary
7. Exercise data refreshes

### Flow 3: "Rewrite the introduction paragraph"

1. Teacher sends: "Rewrite the introduction paragraph to be more engaging"
2. Context includes `lessonId`
3. LLM calls `get_lesson_content(lessonId)`
4. LLM identifies the introduction, rewrites it
5. LLM presents the new introduction in chat and asks for confirmation
6. Teacher says "apply it"
7. LLM calls `update_lesson_content(lessonId, fullUpdatedContent)` — replaces full lesson HTML with only the introduction changed
8. Lesson store refreshes

### Flow 4: "Design a course about machine learning" (no document)

Plan Mode works without a document too — the teacher can describe what they want.

1. Teacher sends: "Design a 6-week course about machine learning for beginners"
2. Agent enters Plan Mode using its training knowledge (no document needed)
3. Returns a `CoursePlan` with sections and lessons
4. Teacher reviews and approves
5. Agent Mode executes — creates sections, lessons, writes content from LLM knowledge

---

## Implementation Phases

### Phase 1: Foundation

- Create `packages/ai-assistant` with types (`AgentRole`, `AgentContext`, `CoursePlan`), provider factory, tool registry (9 v1 tools), system prompt with Plan/Agent mode instructions, content format guidance, locale handling, and no-hallucination boundary
- Add `ai_token_usage` and `ai_credit_balance` tables to DB schema
- Add `GET /agent/status` and `POST /agent/chat` route skeleton with role detection (students get 403 in v1) and token balance check
- Add `POST /agent/upload` route with PDF/DOCX/PPTX parsing (`pdf-parse`, `mammoth`, `pptx-parser`), 100K char text truncation, EARLY_ADOPTER+ plan gating
- Add Redis key management for uploaded document text (one document per conversation, replacement on re-upload)
- Set up Tinybird data sources and add `trackAgentEvent()` utility
- Add "AI Assistant" button to course sidebar (gated on status endpoint + plan check)
- Build right sidebar Sheet with basic chat UI (hardcoded echo responses)
- Add file upload UI (attachment icon, file chip, upload progress, plan-gated upgrade modal for BASIC users)

### Phase 2: Agent Core

- Implement provider factory (OpenAI + Anthropic) using `createModel(config)`
- Wire 9 v1 tools to existing services via `streamText()` with `maxSteps: 15`
- Implement `generate_course_plan` tool with `CoursePlan` JSON schema and token cost estimation
- Implement multi-round plan execution with automatic continuation and partial failure/resume
- Add existing course content detection — append vs. inform teacher before plan execution
- Record token usage after each call; enforce balance check before each call (including mid-plan checks)
- Instrument all tool calls and chat completions with Tinybird events
- Connect chat UI to streaming API via `@ai-sdk/svelte` `Chat` class
- Render streamed tokens and tool status cards
- Build Plan View component (structured plan card with sections/lessons + cost estimate + "Implement Plan" / "Ask for Changes")
- Build Agent Mode progress card (checklist with real-time updates, persists across multi-round execution, shows partial completion state + "Resume" button on failure)
- Implement `onFinish` store refresh for course content tree, lessons, exercises

### Phase 3: Polish + Safeguards + Credits

- Tool-level permission re-validation (verify resource belongs to course/org)
- Rate limiting (per-user, per-org, requests/minute)
- Quick-action chips and context-aware suggestions
- Self-host env var detection and `GET /agent/status` logic
- Conversation context windowing (trim long histories, especially after document upload)
- `POST /agent/credits` for purchasing credit packs
- Credit purchase UI in org settings + exhausted-state UI in chat
- `GET /agent/usage` for detailed usage dashboard
- Stop button during plan execution (graceful — keeps already-created content)

### Phase 4: More Tools

- Section management: `update_section`, `reorder_sections`, `delete_section`
- Lesson management: `update_lesson_metadata`, `delete_lesson`, `reorder_lessons`
- Exercise management: `update_exercise_metadata`, `update_question`, `delete_question`, `delete_exercise`
- Other: `update_course_tags`, `create_newsfeed_post`

### Phase 5: Student Assistant (v2)

- Student tool schemas and execute functions
- Student system prompt template
- Remove the v1 student 403 gate
- Student quick-action chips
- Surface AI assistant in the student course view (course-app)
- Student usage counts against org token budget (same pool)

---

## New Dependencies

| Package | Where | Purpose |
|---------|-------|---------|
| `ai` | `packages/ai-assistant`, `apps/api` | Vercel AI SDK core (`streamText`, `tool`, types) |
| `@ai-sdk/svelte` | `apps/dashboard` | Svelte 5 `Chat` class for streaming chat |
| `@ai-sdk/openai` | `packages/ai-assistant` | OpenAI provider |
| `@ai-sdk/google` | `packages/ai-assistant` | Google (Gemini) provider |
| `@ai-sdk/anthropic` | `packages/ai-assistant` | Anthropic provider |
| `pdf-parse` | `apps/api` | PDF text extraction |
| `mammoth` | `apps/api` | DOCX text extraction |
| `pptx-parser` | `apps/api` | PPTX text extraction |
| `@tinybird-sdk/node` | `apps/api` | Tinybird event ingestion (or raw fetch — see Observability section) |

---

## Files to Create / Modify

### New files

- `packages/ai-assistant/` — entire new package (types, providers, tools, prompts)
- `apps/api/src/routes/agent/` — agent route handlers (chat, upload, status, usage, credits)
- `apps/api/src/services/agent/` — agent service (document parsing, token tracking)
- `apps/api/src/utils/tinybird.ts` — Tinybird event tracking utility
- `apps/dashboard/src/lib/features/ai-assistant/` — UI components (sheet, chat, plan view, progress card, file upload)

### Modified files

- `packages/db/src/schema.ts` — add `ai_token_usage` and `ai_credit_balance` tables
- `apps/api/src/app.ts` — register `/agent` route
- `apps/api/src/utils/redis/key-generators.ts` — add agent document keys
- `apps/dashboard/src/lib/features/course/components/sidebar/course-sidebar-navigation.svelte` — add AI Assistant button

### Existing files referenced (services the agent will call)

- `apps/api/src/services/course/section.ts` — `createCourseSection`, `listCourseSections`
- `apps/api/src/services/lesson/lesson.ts` — `createLesson`, `getLesson`
- `apps/api/src/services/lesson-language.ts` — `upsertLessonLanguageService`
- `apps/api/src/services/exercise/exercise.ts` — `createExercise`, `updateExerciseService`
- `packages/db/src/queries/course/content.ts` — `getCourseContentItems`

---

## Success Criteria

- Teacher can upload a PDF/DOCX/PPTX and get a proposed course structure within 30 seconds
- BASIC plan users see upgrade modal when attempting to upload a document
- Teacher can review, edit, and approve the plan before any content is created
- Agent shows estimated token cost before plan execution
- Agent can execute an approved plan end-to-end: creating sections, lessons, and content, with multi-round continuation for large plans
- Plan execution can resume after failure (token exhaustion, network error, or manual stop)
- Agent checks for existing course content and handles append correctly
- Generated lesson content renders correctly in the TipTap editor
- Teacher can see real-time progress during plan execution
- All standard agent actions work: update lesson text, generate questions, draft lessons
- No user can modify another org's data; all actions pass permission checks
- Self-hosted instances can enable/disable the assistant via env var
- Token usage is tracked and metered per org plan
- All agent events (tool calls, errors, plan executions) are tracked in Tinybird for observability
