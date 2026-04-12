# AI Course Assistant Implementation Plan

## Scope Lock (v1)

1. AI assistant is teacher-only (course team members; not students).
2. Agent executes via API using Vercel AI SDK tool-calling pattern.
3. All actions are org/course-scoped; no cross-org access.
4. Self-hosted: assistant disabled by default; enabled via `AI_API_KEY` env var.
5. Chat lives in a right sidebar (Sheet) triggered from the course sidebar navigation.
6. Two modes: **Plan Mode** (propose course structure from document or prompt) and **Agent Mode** (execute approved actions).
7. Supported actions: upload PDF/DOCX, generate course plan, create sections, create/update lessons, create exercises with questions.

## Delivery Phases

1. Phase 1: Foundation — package + types + DB tables + route skeletons + upload endpoint + sidebar UI shell
2. Phase 2: Agent Core — LLM integration + 9 tools + streaming chat + plan view + agent execution + usage tracking
3. Phase 3: Polish — rate limits, quick actions, self-host gating, credits, stop button
4. Phase 4: More Tools — section/lesson/exercise management (delete, reorder, update metadata)
5. Phase 5: Student Assistant (v2) — student tools, student prompt, course-app surface

## Ticket Breakdown

### Phase 1: Foundation

| ID | Area | Task | Key Files | Dependencies |
| --- | --- | --- | --- | --- |
| AI-1.1 | Package | Create `packages/ai-assistant` with types (`AgentRole`, `AgentContext`, `CoursePlan`, `AIProviderConfig`) | `packages/ai-assistant/src/types.ts` | None |
| AI-1.2 | Package | Implement provider factory (`createModel(config)`) with OpenAI + Anthropic | `packages/ai-assistant/src/providers/index.ts` | AI-1.1 |
| AI-1.3 | Package | Implement tool registry (`getToolSchemas(role)`) with 9 v1 tool schemas | `packages/ai-assistant/src/tools/` | AI-1.1 |
| AI-1.4 | Package | Implement system prompt builder with Plan/Agent mode instructions + no-hallucination boundary | `packages/ai-assistant/src/prompt/` | AI-1.1 |
| AI-1.5 | DB | Add `ai_token_usage` and `ai_credit_balance` tables to schema + migration | `packages/db/src/schema.ts` | None |
| AI-1.6 | API | Add agent route skeleton (`/agent/status`, `/agent/chat`, `/agent/upload`) with auth middleware + role detection | `apps/api/src/routes/agent/` | AI-1.1 |
| AI-1.7 | API | Implement `POST /agent/upload` — plan gating (EARLY_ADOPTER+ required, 403 for BASIC), file size validation (max 5MB), PDF parsing (`pdf-parse`) + DOCX parsing (`mammoth`) + Redis storage | `apps/api/src/services/agent/document.ts` | AI-1.6 |
| AI-1.8 | API | Add Redis key generators for agent documents | `apps/api/src/utils/redis/key-generators.ts` | None |
| AI-1.9 | Dashboard | Add "AI Assistant" button to course sidebar nav (gated on `/agent/status`) | `course-sidebar-navigation.svelte` | AI-1.6 |
| AI-1.10 | Dashboard | Build right sidebar Sheet with placeholder chat UI (message list + input + file upload button) | `apps/dashboard/src/lib/features/ai-assistant/` | AI-1.9 |
| AI-1.11 | Dashboard | Implement file upload flow — plan gate (BASIC clicks attachment icon -> `openUpgradeModal()`), client-side 5MB size check, file picker -> upload -> chip display, handle 403 from server by triggering upgrade modal | `apps/dashboard/src/lib/features/ai-assistant/` | AI-1.7, AI-1.10 |

### Phase 2: Agent Core

| ID | Area | Task | Key Files | Dependencies |
| --- | --- | --- | --- | --- |
| AI-2.1 | API | Wire `POST /agent/chat` to `streamText()` with provider factory + tool schemas + system prompt | `apps/api/src/routes/agent/chat.ts` | AI-1.2, AI-1.3, AI-1.4 |
| AI-2.2 | API | Implement tool execute functions: `get_course_structure`, `get_lesson_content`, `get_exercise_details` (read tools) | `apps/api/src/routes/agent/chat.ts` | AI-2.1 |
| AI-2.3 | API | Implement tool execute functions: `create_section`, `create_lesson`, `update_lesson_content` (write tools) | `apps/api/src/routes/agent/chat.ts` | AI-2.1 |
| AI-2.4 | API | Implement tool execute functions: `create_exercise`, `add_questions` (exercise tools) | `apps/api/src/routes/agent/chat.ts` | AI-2.1 |
| AI-2.5 | API | Implement `generate_course_plan` tool — structured `CoursePlan` JSON output | `apps/api/src/routes/agent/chat.ts` | AI-2.1 |
| AI-2.6 | API | Inject uploaded document text from Redis into LLM context when `documentId` present | `apps/api/src/routes/agent/chat.ts` | AI-1.7, AI-2.1 |
| AI-2.7 | API | Token usage tracking — record `promptTokens` + `completionTokens` after each `streamText()` call | `apps/api/src/services/agent/usage.ts` | AI-1.5, AI-2.1 |
| AI-2.8 | API | Token balance check — enforce before each LLM call, return 402 when exhausted | `apps/api/src/services/agent/usage.ts` | AI-2.7 |
| AI-2.9 | Dashboard | Connect chat UI to `/agent/chat` via `@ai-sdk/svelte` `Chat` class | `apps/dashboard/src/lib/features/ai-assistant/` | AI-2.1, AI-1.10 |
| AI-2.10 | Dashboard | Render streamed tokens and tool status cards (spinner -> checkmark) | `apps/dashboard/src/lib/features/ai-assistant/` | AI-2.9 |
| AI-2.11 | Dashboard | Build Plan View component — structured plan card with sections/lessons tree, "Implement Plan" and "Ask for Changes" buttons | `apps/dashboard/src/lib/features/ai-assistant/plan-view.svelte` | AI-2.5, AI-2.9 |
| AI-2.12 | Dashboard | Build Agent Mode progress card — real-time checklist during plan execution | `apps/dashboard/src/lib/features/ai-assistant/progress-card.svelte` | AI-2.11 |
| AI-2.13 | Dashboard | Implement `onFinish` store refresh — course content tree, lesson, exercise data | `apps/dashboard/src/lib/features/ai-assistant/` | AI-2.9 |
| AI-2.14 | Dashboard | Add usage meter to AI assistant sidebar header | `apps/dashboard/src/lib/features/ai-assistant/` | AI-2.8 |

### Phase 3: Polish + Safeguards + Credits

| ID | Area | Task | Key Files | Dependencies |
| --- | --- | --- | --- | --- |
| AI-3.1 | API | Tool-level permission re-validation (verify resource belongs to course/org in every tool execute) | `apps/api/src/routes/agent/chat.ts` | AI-2.2, AI-2.3, AI-2.4 |
| AI-3.2 | API | Rate limiting — per-user, per-org requests/minute on agent endpoints | `apps/api/src/middlewares/` | AI-1.6 |
| AI-3.3 | API | Self-host env var detection: hide assistant when no `AI_API_KEY`; uncap rate limits for self-hosted | `apps/api/src/routes/agent/status.ts` | AI-1.6 |
| AI-3.4 | API | Conversation context windowing — trim long message histories, especially after document uploads | `apps/api/src/routes/agent/chat.ts` | AI-2.1 |
| AI-3.5 | API | `POST /agent/credits` — credit purchase endpoint (orgAdmin only) | `apps/api/src/routes/agent/credits.ts` | AI-1.5 |
| AI-3.6 | API | `GET /agent/usage` — detailed usage stats endpoint | `apps/api/src/routes/agent/usage.ts` | AI-2.7 |
| AI-3.7 | Dashboard | Quick-action chips (context-dependent: document upload, draft lesson, generate questions, improve text) | `apps/dashboard/src/lib/features/ai-assistant/` | AI-2.9 |
| AI-3.8 | Dashboard | Stop button during plan execution (graceful halt, keep created content) | `apps/dashboard/src/lib/features/ai-assistant/` | AI-2.12 |
| AI-3.9 | Dashboard | Exhausted-state UI — disable chat input when tokens run out, show upgrade prompt | `apps/dashboard/src/lib/features/ai-assistant/` | AI-2.14 |
| AI-3.10 | Dashboard | Credit purchase UI in org settings | `apps/dashboard/src/lib/features/org-settings/` | AI-3.5 |

## API Contract

### GET /agent/status

```typescript
// Response
{
  enabled: boolean,              // false when self-hosted + no AI_API_KEY
  role: 'teacher' | 'student',
  usage: {
    used: number,
    allowance: number,
    creditBalance: number,
    remaining: number
  }
}
```

### POST /agent/chat

```typescript
// Request
{
  courseId: string,
  messages: UIMessage[],          // Vercel AI SDK format
  context?: {
    lessonId?: string,
    exerciseId?: string,
    documentId?: string
  }
}
// Response: SSE stream (toUIMessageStreamResponse())
```

### POST /agent/upload

```typescript
// Request: multipart/form-data with 'file' field (PDF or DOCX, max 5MB)
// Requires: EARLY_ADOPTER+ plan

// Success Response (200)
{
  documentId: string,
  fileName: string,
  mimeType: string,
  pageCount: number | null,
  wordCount: number,
  textPreview: string
}

// Error Responses
// 403: { error: "document_upload_requires_upgrade", upgradeRequired: true }  — BASIC plan
// 413: { error: "file_too_large", maxSize: 5242880 }                         — > 5MB
// 415: { error: "unsupported_file_type", allowed: [...] }                    — not PDF/DOCX
```

### GET /agent/usage

```typescript
// Response
{
  used: number,
  allowance: number,
  creditBalance: number,
  remaining: number,
  history: Array<{ date: string, tokens: number }>
}
```

### POST /agent/credits

```typescript
// Request
{ amount: number }
// Response
{ creditBalance: number }
```
