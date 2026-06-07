# Chat-mode vs Run-mode — where the split lives and why it's fragile

The AI assistant has two execution modes that share most of their plumbing. This doc enumerates exactly where each mode is decided, surfaced, and routed, and the three places the split is currently load-bearing on heuristics rather than enforcement.

## Mode definitions

- **Chat mode** — interactive, request/response. The user types, the API streams an assistant turn, and tool calls execute _inline inside that turn_. No `agent_run` row. Lives in the foreground HTTP process. Bounded by AI SDK `stopWhen` (currently `stepCountIs(...)`) and the user's session.
- **Run mode** — durable background execution. The user (or the agent on the user's behalf) creates an `agent_run` row; a BullMQ job is enqueued; the worker process drives the same tools to completion across many rounds. Pollable. Cancellable. Resumable.

Both modes call the **same tool implementations** (`packages/core/src/services/agent/chat-tools.ts`) against the **same schemas** (`agent-tool-schemas.ts`). The only difference is _who is driving the loop and where_.

## Where the split is decided

### 1. Trigger — only one path creates a run

- `apps/dashboard/src/lib/features/ai-assistant/ai-course-chat.svelte:617` — `handleImplementPlan(editedPlan)`. Called when the user clicks **Implement Plan** in the plan-view card.
- `apps/dashboard/src/lib/features/ai-assistant/api/ai-assistant.svelte.ts:291` — `aiAssistantApi.createRun(...)` posts to the API.
- `apps/api/src/routes/agent/runs.ts:41` — `POST /agent/runs` inserts the row and enqueues a BullMQ job.

Everything else — every other user message, every tool call the model makes during a chat turn — is **chat mode by default**. There is no second trigger.

### 2. Worker — what actually executes a run

- `apps/jobs/src/workers/agent-course-generation.ts` — the BullMQ worker that pulls run jobs.
- `packages/core/src/services/agent/course-generation-runner.ts` — `runAgentCourseGenerationJob(...)`, the loop the worker invokes. Streams tool calls, persists steps, respects cancel/pause.

### 3. Chat — the other endpoint

- `apps/api/src/routes/agent/agent.ts` — the `/agent/chat` route. Streams an assistant turn via the AI SDK with the same tool set bound. This is where every chat-mode tool call actually fires.

### 4. UI mode switching

- `ai-course-chat.svelte:97-103` — the status sets that classify a run:
  - `RUN_MODE_STATUSES` — `queued|running|waiting_for_input|paused|failed|canceled`. Any of these keeps the panel in "running" mode.
  - `RUN_RESUMABLE_STATUSES` — `paused|waiting_for_input|canceled`. Controls the Resume button.
  - `INJECTABLE_RUN_STATUSES` — `completed`. The only status that auto-injects a synthetic summary message.
- `ai-course-chat.svelte:898-903` — `panelMode` derivation. Reads `aiAssistantApi.currentRun.status` and flips the bottom of the chat between `RunMonitorPane` and `ChatInput`.
- `ai-course-chat.svelte:1320-1346` — render switch.

### 5. Prompt — the _de facto_ routing logic

- `packages/ai-assistant/src/prompt/teacher.ts:55-104` — Plan Mode vs Agent Mode, plus "Driving an approved plan to completion" and "Re-engaging a course where an approved plan exists".

This file is where the model is _told_ to use `generate_course_plan` for big work and inline tools for small edits. **It is the only thing keeping the model from doing everything inline in chat.** No code rejects a chat-mode call to a "heavy" tool.

## Why the split is fragile

### 1. Mode routing is LLM-decided, not enforced

The same tool set is bound in both modes. Whether `update_lesson_content` for ten lessons runs inline (chat) or via a plan→run is decided entirely by how the model interprets the system prompt. Drift in the prompt, a new model with different defaults, or a user prompt that subtly bypasses the plan flow — any of these route heavy work into chat mode where there's no retry, no resume, no progress card, and no cancel button.

**Observed:** a transcript where the agent updated three lessons inline across one streamed turn. None of it ran through the durable runner. The user only realized when they noticed there was no run history entry.

### 2. Run can stick at `queued`

Run creation enqueues to BullMQ. If the worker can't pick the job up (worker crashed, Redis blip, module-resolution boot failure, schema mismatch on payload), the run sits at `queued` indefinitely. The frontend polls run status but has no "worker hasn't moved past queued in N seconds" guardrail. The user sees a stalled progress card with no error.

**Observed:** `ERR_MODULE_NOT_FOUND` from a cross-app import made the worker boot fail silently from the user's perspective. Cause was only visible in worker logs.

### 3. Resume/Dismiss/chat boundary

Canceled run → user clicks Dismiss → `aiAssistantApi.currentRun = null` → `panelMode` flips to `planning` → chat input returns. From here the user can type anything, and the model handles it as a fresh chat turn — including content edits — without the prompt-level "this was canceled, reconcile first" hint being load-bearing.

We mitigate (3) at the prompt level only:

- `chat-history.ts:TOOLS_WITH_FULL_OUTPUT` now includes `get_course_structure` and `get_exercise_details` so the model can see what was already created.
- `teacher.ts` has the "Re-engaging a course where an approved plan exists" rule telling the model to call `get_course_structure` first.

Both are prompt-trust mitigations. Neither is enforcement.

## Tools that are shared between modes

Every tool defined in `chat-tools.ts` is callable from both endpoints. The notable mutation-heavy ones:

- `update_lesson_content` — writes full lesson HTML. A single call can be 5–20k tokens of output.
- `add_questions` / `update_questions` — can add/update arbitrary-sized question batches in one call.
- `create_lesson`, `update_lesson`, `create_exercise`, `update_exercise`.
- `update_course_landing_page` — full landing-page mutation, including image generation.
- `go_live_course` — publishes the course.

Reads (`get_course_structure`, `get_lesson_content`, `get_exercise_details`) are also shared and have no execution-cost concern.

## Recommended hardening (not implemented)

Three bite-sized steps that move the routing decision from prompt-land into code-land:

1. **Gate heavy tools to run-mode at the API layer.** Whitelist a small set of cheap chat-mode tools; reject the rest from `/agent/chat` with a structured error that the model can read and translate into "I need to make a plan for this." This stops mode drift.
2. **Surface run health.** If `currentRun.status === 'queued'` for >30s with no `lastHeartbeat`, render a "Worker not responding" affordance with a retry button. Stops silent stalls.
3. **Tighten the chat-after-cancel boundary.** Either keep the canceled-run pane visible alongside the chat input (so Resume is always one click away) or disable chat input until the user explicitly Dismisses. Removes the "type continue and hope the prompt does the right thing" failure mode.

None of these unify the two modes — that's a multi-month rewrite. They just stop the LLM and the worker queue from being single points of failure for routing.
