# Flow 05 — AI assistant & tutor

- **Personas:** Admin/Tutor (authoring assistant); Student (lesson tutor)
- **Features covered (FEATURE_AUDIT §2):** 18 AI Course Assistant · 19 AI Lesson Tutor
- **Modes:** both — **key-gated** (needs OPENAI/GOOGLE/ANTHROPIC key)
- **Map refs:** FEATURE_AUDIT §3.13, §3.14

## Preconditions
- Set at least one provider key (`OPENAI_API_KEY` / `GOOGLE_API_KEY` / `ANTHROPIC_API_KEY`).
- Also run **without** a key to verify the disabled state.

## Happy path

- [ ] **Status gate (no key).** With no key, AI button hidden / `GET /agent/status` → `enabled:false`; calling AI → `503 AI_NOT_CONFIGURED`. _Ref:_ §3.13, README:236.
- [ ] **Status gate (key set).** With a key, AI button appears; `/agent/status` → `enabled:true`.
- [ ] **Assistant generates outline.** In a course, chat to generate an outline → content created. _Ref:_ `routes/agent/*`, `packages/ai-assistant`, `schema.ts:3163`.
- [ ] **Assistant edits content.** Ask it to edit a lesson → change applied; run tracked. _Ref:_ `aiAgentRun/Step/Event` `schema.ts:3163,3225,3259`.
- [ ] **Model picker persists.** Selected model saved in `localStorage` (`classroomio-ai-chat-model`); provider resolved server-side. _Ref:_ §3.13.
- [ ] **Lesson tutor answers.** As student in a lesson, ask the tutor → answer returned; counts toward cap. _Ref:_ `routes/course/ai-tutor.ts`, `aiTutorMessageCount` `schema.ts:3013`.
- [ ] **Fair-use cap.** Exceed the per-org cap → cap event + graceful block. _Ref:_ `aiTutorCapEvent` `schema.ts:3050`, settings `lib/features/ai-tutor-settings`.

## Edge cases / probes
- [ ] **Invalid/expired key** → clear error, not a crash.
- [ ] **Per-model provider resolution** picks the right provider.
- [ ] **Anthropic** is supported in code but **not in the picker UI** — confirm picker only shows Gemini + GPT-4o. _Ref:_ README:231, audit §7.6.
- [ ] **Cap reset** behaves per configured window.

**Coverage:** features 18, 19.
