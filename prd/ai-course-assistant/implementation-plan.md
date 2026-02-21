# AI Course Assistant Implementation Plan

## Scope Lock (v1)

1. AI assistant is teacher-only (course team members; not students).
2. Agent executes via API (no local-only execution).
3. All actions are org/course-scoped; no cross-org access.
4. Self-hosted: assistant not available; hide UI and block agent routes.
5. Chat lives in a right sidebar (Sheet) from the course header.
6. Supported intents: update lesson text, generate questions from text, draft lesson; exercise tagging TBD (clarify org tags vs template tags).

## Delivery Phases

1. Phase A: Package + types + self-host gate
2. Phase B: Agent API routes + permission checks
3. Phase C: Chat UI + header button
4. Phase D: LLM integration + intent execution
5. Phase E: Polish (quick actions, context, rate limits)

## Ticket Breakdown

| ID | Area | Task | Key Files | Dependencies | Done When |
| --- | --- | --- | --- | --- | --- |
| AI-A1 | Package | Create `packages/ai-assistant` with types (Message, Intent, Response) | `packages/ai-assistant/src/types.ts` | None | Package builds; types exportable |
| AI-A2 | Package | Add optional API client for agent chat | `packages/ai-assistant/src/client.ts` | AI-A1 | Client can call agent endpoints (or dashboard uses RPC directly) |
| AI-A3 | Dashboard | Add `isAiAssistantAvailable` util (false when `PUBLIC_IS_SELFHOSTED`) | `apps/dashboard/src/lib/utils/ai-assistant.ts` | None | Util returns bool; hide button when self-hosted |
| AI-B1 | API | Add agent validation schemas (chat payload, intent payloads) | `packages/utils/src/validation/agent/` | None | Zod schemas for chat + intents |
| AI-B2 | API | Add agent routes under `/course/:courseId/agent`; do not register or return 403 when self-hosted | `apps/api/src/routes/course/agent.ts` | AI-B1 | `POST /chat`, `POST /execute` (or combined); blocked when `PUBLIC_IS_SELFHOSTED` |
| AI-B3 | API | Apply auth + courseTeamMember middleware to agent routes | `apps/api/src/routes/course/agent.ts` | AI-B2 | Unauthorized users get 403 |
| AI-B4 | API | Add agent service: parse message → intent → call lesson/exercise services | `apps/api/src/services/agent.ts` | AI-B2 | Service orchestrates intents; returns structured response |
| AI-B5 | API | Verify org/course scoping in every agent mutation | `apps/api/src/services/agent.ts` | AI-B4 | Cross-org requests rejected |
| AI-C1 | Dashboard | Add AI Assistant button to course header | `apps/dashboard/src/lib/features/course/components/course-header.svelte` | AI-A3 | Button visible when `isAiAssistantAvailable` and teacher |
| AI-C2 | Dashboard | Add right Sheet with chat UI (message list + input) | `apps/dashboard/src/lib/features/ai-assistant/ai-assistant-sheet.svelte` | AI-C1 | Sheet opens from button; placeholder chat |
| AI-C3 | Dashboard | Create AI assistant feature module (store, API class) | `apps/dashboard/src/lib/features/ai-assistant/` | AI-A1 | API class calls agent endpoint; store holds messages |
| AI-C4 | Dashboard | Wire chat input → API → message display | `apps/dashboard/src/lib/features/ai-assistant/` | AI-C3, AI-B2 | User can send message; response shows in chat |
| AI-D1 | API | Integrate LLM provider (OpenAI/Anthropic) for chat completion | `apps/api/src/services/agent.ts` | AI-B4 | Agent can generate text from user message |
| AI-D2 | API | Implement intent: update lesson text | Agent service + lessonLanguage service | AI-D1 | "Update this text..." → `updateLessonLanguageService` |
| AI-D3 | API | Implement intent: generate N questions from text | Agent service | AI-D1 | Returns generated questions as text; user copies or we add create flow later |
| AI-D4 | API | Implement intent: draft lesson | Agent service + `createLesson` | AI-D1 | Creates draft lesson; returns lesson ID for navigation |
| AI-D5 | API | Clarify and implement exercise tagging intent | Agent service + tag/course APIs | AI-D1 | Semantic clarified in PRD; implement |
| AI-E1 | Copy | Add i18n keys for AI assistant UI | `apps/dashboard/src/lib/utils/translations/en.json` | AI-C2 | No hardcoded strings |
| AI-E2 | API | Add rate limiting for agent endpoints | Middleware or route-level | AI-B2 | Prevents abuse; configurable limit |
| AI-E3 | Tests | Add auth/role tests for agent routes | API tests | AI-B3 | Unauthorized/student requests return 403 |

## API Contract (Target)

### Agent Chat

- `POST /course/:courseId/agent/chat`
  - Body: `{ message: string, context?: { lessonId?, exerciseId? } }`
  - Response: `{ success: true, data: { message: string, intent?: string, actions?: [...] } }`
  - Auth: `authMiddleware`, `courseTeamMemberMiddleware`

### Optional Structured Execute

- `POST /course/:courseId/agent/execute`
  - Body: `{ intent: string, payload: Record<string, unknown> }`
  - For tool-calling or explicit intent execution (e.g. from LLM tool use)
  - Auth: same as above

## Open Items Before Implementation

1. LLM provider choice (OpenAI vs Anthropic vs configurable).
2. Streaming: v1 non-streaming vs SSE streaming.
3. Exercise tagging semantics (org course tags vs exercise template tags).
4. Draft lesson: create immediately vs return text for paste.
