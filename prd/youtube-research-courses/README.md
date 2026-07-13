---
name: YouTube Research Courses
overview: Add a research workflow that turns a learner or teacher goal into a reviewable YouTube-backed learning path, using video discovery, transcript or segment analysis, coverage scoring, and existing ClassroomIO course publishing primitives.
todos:
  - id: prd-review
    content: Finalize naming, transcript policy, source limits, pricing gates, and YouTube API quota assumptions
    status: pending
  - id: research-model
    content: Add persistent research run, candidate video, transcript, segment, and coverage data model
    status: pending
  - id: discovery
    content: Implement YouTube search, metadata enrichment, deduplication, and cheap candidate ranking
    status: pending
  - id: transcript-ingestion
    content: Implement pluggable transcript ingestion with explicit provider policy and fallback states
    status: pending
  - id: ai-analysis
    content: Implement goal decomposition, chunk analysis, coverage scoring, gap detection, and sequence planning
    status: pending
  - id: review-ui
    content: Build dashboard review UI for candidate videos, selected timestamps, coverage, and teacher edits
    status: pending
  - id: publish
    content: Publish approved YouTube learning paths into existing course sections, lessons, and exercises
    status: pending
  - id: learner-experience
    content: Render embedded YouTube lessons with timestamps, objectives, progress, and optional checks
    status: pending
  - id: observability
    content: Track API quota, model token usage, transcript cost, cache hit rate, and run quality metrics
    status: pending
isProject: false
---

# YouTube Research Courses PRD

## Status

- Draft

## Date

- July 13, 2026

## Purpose

Add a **YouTube research workflow** that lets a teacher or creator describe a learning goal, discovers relevant YouTube videos, analyzes their usefulness, and produces a sequential, reviewable training path that can be published into ClassroomIO.

The product should answer questions like:

- "I want to learn React Server Components from scratch."
- "Build a beginner-friendly training path for data analysis with Python."
- "Find YouTube videos that teach SOC 2 basics to non-technical employees."
- "Use the best parts of these videos to create a short course."

The output is not just a list of links. The system should produce a structured learning path with:

- course title and description
- prerequisites and target learner level
- ordered lessons or modules
- selected videos and timestamp ranges
- rationale for why each video or segment is included
- coverage map against the original learning goal
- optional generated checkpoints or quizzes
- teacher review before publishing

## Problem Statement

Teachers and learners already use YouTube as a large informal knowledge base, but turning search results into a coherent learning sequence is manual and unreliable.

Current gaps:

- YouTube search results are not the same as a curriculum.
- Good videos often contain only some useful segments, not a clean lesson boundary.
- Long videos need timestamp selection, not full-video assignment.
- A single video may not satisfy the whole goal.
- Multiple videos can overlap, conflict, or assume different prerequisites.
- ClassroomIO can embed YouTube videos today, but it does not inspect them, score coverage, or build a path from them.
- Existing transcription in the product is for uploaded videos, not third-party YouTube videos.
- Existing Study from Source work explicitly excludes video and YouTube ingestion, so this feature needs a separate product and engineering scope.

## Executive Summary

**YouTube Research Courses** introduces a research pipeline that turns a broad learning goal into a timestamped, YouTube-backed course draft.

The workflow:

1. Teacher enters a goal, learner level, constraints, and optional seed videos or channels.
2. System decomposes the goal into learning objectives and search queries.
3. System discovers YouTube candidates and enriches them with metadata.
4. System cheaply ranks candidates using metadata before spending model tokens on transcripts.
5. System ingests transcripts where allowed and available.
6. System segments transcripts into timestamped chunks.
7. System scores chunk coverage against learning objectives.
8. System assembles a sequential learning path.
9. Teacher reviews, edits, excludes videos, adjusts timestamps, and approves.
10. System publishes the approved path into existing course sections, lessons, videos, and optional exercises.

The most important product constraint is transcript access. Official YouTube Data API search and metadata access are straightforward, but public caption text access is not a general-purpose unauthenticated API. The PRD therefore requires a pluggable transcript layer and explicit compliance review before any provider that downloads or derives third-party video transcripts is enabled in production.

## Product Positioning

### Primary Use Case: Course Research

The teacher wants ClassroomIO to find and structure external video content for a learning goal.

Example:

> "Create a 90-minute beginner course on SQL joins using YouTube videos."

Output:

- 4 to 6 lessons
- each lesson has one selected YouTube video or timestamp range
- each lesson has learning objectives
- optional short notes generated by ClassroomIO
- optional quiz questions grounded in selected segments
- coverage report showing which goal requirements are satisfied

### Secondary Use Case: Curate From Provided Videos

The teacher already has links and wants ClassroomIO to inspect and sequence them.

Example:

> "Use these 8 videos to build a training path for new support engineers."

Output:

- duplicate and overlap detection
- best segment selection
- recommended order
- gaps and missing prerequisites
- rejected videos with reasons

### Later Use Case: Learner-Led Research

A learner asks for a personal path from public YouTube content.

This is intentionally deferred until after teacher-led workflows because learner-led research needs additional safety, content quality, and plan-limit controls.

## Goals

1. Convert a plain-language learning goal into a structured YouTube-backed learning path.
2. Discover candidate videos through YouTube search and optional seed links.
3. Rank candidates cheaply before doing transcript-heavy AI analysis.
4. Analyze available transcript segments and map them to explicit learning objectives.
5. Support one-video, multi-video, and timestamped-segment learning paths.
6. Detect obvious coverage gaps, duplicate coverage, prerequisite jumps, and low-confidence selections.
7. Make the generated plan editable and reviewable before publishing.
8. Publish approved plans into existing ClassroomIO course sections, lessons, embedded YouTube videos, and exercises.
9. Track API quota, model token usage, transcript cost, run status, and cache hit rates.
10. Keep transcript acquisition compliant, provider-driven, observable, and replaceable.

## Non-Goals (v1)

- Downloading or redistributing YouTube video files.
- Cutting and hosting derivative clips from YouTube videos.
- Automatically publishing courses without teacher review.
- Guaranteeing transcript availability for every public YouTube video.
- Private, members-only, age-restricted, or login-required video ingestion.
- Full web research outside YouTube.
- Real-time collaborative editing of generated research plans.
- A public learner-facing YouTube search engine.
- Recommending harmful, adult, misleading, or policy-sensitive content without review.
- Replacing the existing AI course assistant execution pipeline.

## Product Decisions

1. The working feature name is **YouTube Research Courses**.
2. The v1 output is a reviewable **learning path**, not an automatically published course.
3. The first publish target is the existing self-paced course model.
4. YouTube videos remain embedded from YouTube; ClassroomIO stores metadata, transcript-derived analysis, and course structure.
5. Timestamp ranges are first-class. A lesson can point to an entire video or a segment.
6. Transcript ingestion must be pluggable and policy-controlled.
7. Research runs must be resumable, cancelable, and observable through the jobs system.
8. The system must fail gracefully when transcript access is unavailable: metadata-only candidates can be shown, but deep coverage confidence must be low.
9. Caching is required for all expensive video metadata, transcript, embedding, and analysis artifacts.
10. Teacher review is mandatory in v1 because external video quality and licensing are not fully controlled by ClassroomIO.

## Current-State Audit

| Capability | Current State | Notes |
| --- | --- | --- |
| YouTube lesson embeds | Exists | Lessons can already store YouTube links and render them through media player components. |
| YouTube URL parsing | Exists | `packages/core/src/services/assets/assets.ts` extracts YouTube IDs and metadata. |
| Uploaded-video transcription | Exists | Jobs worker extracts audio and transcribes uploaded assets into `media_transcript`. |
| YouTube transcript ingestion | Missing | Existing agent tools explicitly say embedded YouTube links return no transcript. |
| AI course generation | Exists | Durable course-generation worker can create sections, lessons, exercises, and content. |
| Study from Source | Draft PRD | Covers documents, webpages, and pasted text but excludes YouTube/video ingestion in v1. |
| Asset model | Exists | Supports `youtube` provider for video links, but not research candidate scoring or segment coverage. |
| Job infrastructure | Exists | BullMQ media and agent jobs can be reused for long-running research runs. |
| Usage tracking | Exists | Token usage recording exists for AI assistant; extend for research runs. |

## External Constraints

### YouTube API

Verified against official YouTube Data API docs on July 13, 2026:

- Every YouTube Data API request costs at least one quota point.
- `search.list` has its own default daily quota bucket and costs 1 quota per call.
- `videos.list` costs 1 quota per call.
- `captions.list` costs 50 quota units and returns caption track metadata, not the caption text.
- Caption operations require OAuth authorization scopes. They are not a general way to fetch arbitrary public captions for videos ClassroomIO does not own.

References:

- https://developers.google.com/youtube/v3/determine_quota_cost
- https://developers.google.com/youtube/v3/docs/captions/list
- https://developers.google.com/youtube/v3/docs/captions/download

### AI Cost

Model and transcription prices change over time. The implementation must not hardcode pricing assumptions in prompts or business logic. Use centralized provider pricing configuration and persist actual usage per run:

- input tokens
- cached input tokens where available
- output tokens
- embedding tokens
- transcription minutes or tokens
- provider model IDs
- estimated cost at run time

Reference:

- https://platform.openai.com/docs/pricing

## User Personas

### Teacher

Wants to quickly assemble a credible YouTube-based course without manually watching dozens of videos.

### Training Operator

Wants low-cost internal training that uses public expert videos while preserving a clear course structure, quizzes, and completion tracking.

### Course Creator

Wants to research a topic and produce an editable course draft with external videos, notes, and assessments.

### Learner

Wants a path that feels coherent and avoids random playlist hopping.

## Jobs To Be Done

1. Enter a learning goal and get a structured video learning path.
2. Provide seed videos and have ClassroomIO select useful segments.
3. Understand which videos were rejected and why.
4. Review coverage before publishing.
5. Turn approved videos into lessons with objectives and optional quizzes.
6. Track learner progress through video lessons.
7. Control AI spend and prevent runaway research jobs.

## User Experience

### Entry Points

V1 should expose the workflow from the teacher dashboard:

- Course creation flow: "Create from YouTube research"
- Existing course lessons page: "Research YouTube videos"
- AI assistant prompt shortcut: "Build a course from YouTube"

### Research Form

Fields:

| Field | Required | Notes |
| --- | --- | --- |
| Learning goal | Yes | Natural language prompt. |
| Target learner | Yes | Beginner, intermediate, advanced, or custom. |
| Desired length | Optional | Total minutes or number of lessons. |
| Language | Optional | Defaults to org or user locale. |
| Recency preference | Optional | Any time, last year, last month. |
| Include channels | Optional | Preferred channel URLs or handles. |
| Exclude channels | Optional | Avoid known low-quality sources. |
| Seed videos | Optional | User-provided YouTube URLs. |
| Assessment preference | Optional | None, checkpoints, lesson quizzes, final quiz. |
| Strictness | Optional | Balanced, high quality only, broad exploration. |

### Run Progress

The research run should show staged progress:

1. Understanding goal
2. Searching YouTube
3. Ranking candidates
4. Loading transcripts
5. Scoring coverage
6. Building learning path
7. Ready for review

Each stage should show warnings such as:

- "Transcript unavailable for 9 videos."
- "Search quota exhausted."
- "Only metadata-level confidence is available for some candidates."
- "No high-confidence video covers Objective 4."

### Review Screen

The review screen should have four panels:

| Panel | Purpose |
| --- | --- |
| Learning path | Ordered modules and lessons with selected videos and timestamps. |
| Coverage map | Objectives, covered segments, confidence, and gaps. |
| Candidate library | Included, rejected, and undecided videos with reasons. |
| Cost and source log | Tokens, transcript provider, YouTube quota, warnings. |

Teacher actions:

- approve path
- remove video or segment
- change lesson order
- replace candidate
- adjust timestamp start/end
- merge or split lessons
- request more research for a specific gap
- regenerate quizzes
- publish to course

### Published Course Experience

Published lessons should reuse existing lesson and video UI patterns:

- YouTube embedded player
- lesson title and objectives
- selected timestamp range, if any
- optional lesson notes
- optional generated exercise
- progress tracking based on current video progress infrastructure where possible

If a timestamp range is selected, the player should start at the segment start time and display the intended range in the lesson metadata. Hard enforcement of end-time stopping is not required in v1.

## Functional Requirements

### 1. Goal Decomposition

The system must convert the prompt into a structured research brief:

```json
{
  "topic": "React Server Components",
  "targetLevel": "beginner",
  "outcomes": [
    "Explain what server components are",
    "Understand when to use client components",
    "Build a small example"
  ],
  "prerequisites": ["Basic React", "Basic JavaScript"],
  "avoid": ["Framework flamewars", "Outdated Next.js alpha APIs"],
  "preferredDurationMinutes": 90,
  "searchQueries": [
    "React Server Components beginner tutorial",
    "Next.js Server Components explained",
    "React client component vs server component tutorial"
  ]
}
```

### 2. Candidate Discovery

The system must support:

- YouTube API search by generated query.
- Seed video ingestion from user-provided URLs.
- Optional channel include and exclude filters.
- Pagination with quota-aware limits.
- Metadata enrichment through `videos.list`.
- Deduplication across queries.

Candidate metadata should include:

- video ID
- title
- description
- channel ID
- channel title
- published date
- duration
- thumbnail
- view count, like count, and comment count when available
- embeddability status when available
- language hints when available
- source query or seed origin

### 3. Cheap Ranking

Before transcript analysis, the system must score candidates using low-cost signals:

- query relevance
- title and description semantic similarity to the research brief
- duration fit
- recency fit
- channel preference
- engagement per age
- duplicate and playlist overlap
- known rejected channel list
- unsafe or low-quality keyword flags

Only the top candidate pool should proceed to transcript ingestion.

Default v1 limits:

| Limit | Default |
| --- | --- |
| Search queries per run | 5 |
| Search results per query | 10 |
| Candidate videos after dedupe | 50 |
| Videos sent to transcript ingestion | 12 |
| Videos deeply analyzed | 8 |
| Max selected lessons | 10 |

These limits must be configurable by plan tier and environment.

### 4. Transcript Ingestion

The transcript subsystem must be provider-based:

```ts
type TranscriptProvider = 'youtube_authorized' | 'manual_upload' | 'third_party' | 'audio_transcription' | 'unavailable';
```

Provider rules:

- `youtube_authorized`: For videos owned by the connected YouTube account or content owner where OAuth scopes permit caption access.
- `manual_upload`: Teacher uploads or pastes a transcript for a video.
- `third_party`: Optional provider only if approved after legal/product review.
- `audio_transcription`: Optional provider only if approved after legal/product review and platform terms review.
- `unavailable`: No transcript is available; video can only be metadata-ranked.

The system must persist transcript provider, acquisition timestamp, language, source hash, and policy flags. If the transcript provider is not approved for the current environment, the run must skip transcript ingestion and continue with a warning.

### 5. Segmenting

Transcript text must be split into timestamped segments suitable for scoring.

Segment shape:

```json
{
  "videoId": "abc123",
  "startSeconds": 240,
  "endSeconds": 510,
  "text": "Segment transcript text...",
  "summary": "Explains the difference between server and client components.",
  "concepts": ["server components", "client components", "hydration"],
  "difficulty": "beginner",
  "embeddingId": "..."
}
```

Segmentation rules:

- Prefer natural transcript boundaries when available.
- Merge very short captions into coherent 2 to 6 minute segments.
- Split long videos by topic shift, not fixed time only.
- Preserve timestamps for source traceability.
- Store both raw transcript segments and AI-normalized learning segments.

### 6. Coverage Scoring

The system must score each segment against learning objectives.

Coverage record:

```json
{
  "objectiveId": "obj_1",
  "candidateVideoId": "video_1",
  "segmentId": "segment_4",
  "coverageScore": 0.86,
  "confidence": "high",
  "rationale": "Clearly explains the concept and provides a simple example.",
  "limitations": ["Does not cover production caveats."]
}
```

Coverage should account for:

- objective match
- depth
- clarity
- learner level fit
- prerequisite burden
- redundancy with earlier selected segments
- video quality and embeddability
- recency risk for fast-moving topics

### 7. Sequencing

The learning path planner must order selected videos or segments by:

- prerequisites first
- conceptual dependency
- increasing difficulty
- minimal repetition
- total duration target
- coverage completeness

The planner must support three outcomes:

| Outcome | Use When |
| --- | --- |
| Single-video path | One video satisfies most requirements with high confidence. |
| Multi-video path | Several videos collectively cover the goal. |
| Segment path | Only parts of longer videos are useful. |

### 8. Gap Detection

The system must identify:

- uncovered objectives
- objectives covered only by low-confidence metadata matches
- outdated or version-sensitive content
- missing prerequisites
- excessive overlap
- videos that are too long for their value

Teachers should be able to request targeted follow-up research for a gap instead of rerunning the entire workflow.

### 9. Publishing

Publishing must create or update existing ClassroomIO records instead of adding a parallel course runtime.

Publish targets:

- course
- course sections
- lessons
- lesson video entries with `type: 'youtube'`
- optional lesson notes
- optional exercises

Publish behavior:

- The teacher chooses new course or existing course.
- The approved plan is converted into sections and lessons.
- Each selected video stores canonical YouTube URL, title, thumbnail, duration, and optional timestamp range metadata.
- Generated notes and exercises are marked as AI-generated draft content.
- Source coverage map remains attached to the research run for audit and future editing.

## Data Model Proposal

### `youtube_research_run`

Tracks one research request.

Key fields:

- `id`
- `organizationId`
- `courseId` nullable
- `createdBy`
- `status`: `draft | queued | running | needs_review | publishing | completed | failed | canceled`
- `stage`
- `progressPercent`
- `goal`
- `targetLevel`
- `language`
- `constraints`
- `researchBrief`
- `approvedPlan`
- `publishedCourseId` nullable
- `tokenUsage`
- `quotaUsage`
- `costCents`
- `warnings`
- `createdAt`
- `updatedAt`
- `finishedAt`

### `youtube_research_candidate`

Stores discovered and seed videos.

Key fields:

- `id`
- `runId`
- `videoId`
- `canonicalUrl`
- `title`
- `description`
- `channelId`
- `channelTitle`
- `publishedAt`
- `durationSeconds`
- `thumbnailUrl`
- `statistics`
- `embeddable`
- `sourceType`: `search | seed | teacher_added`
- `sourceQuery`
- `metadataScore`
- `transcriptStatus`
- `analysisStatus`
- `selected`
- `rejectionReason`

### `youtube_video_transcript`

Stores transcript metadata and text when available.

Key fields:

- `id`
- `organizationId`
- `videoId`
- `candidateId` nullable
- `provider`
- `language`
- `text`
- `rawSegments`
- `sourceHash`
- `policy`
- `costCents`
- `createdAt`
- `expiresAt` nullable

### `youtube_video_segment`

Stores normalized learning chunks.

Key fields:

- `id`
- `transcriptId`
- `videoId`
- `startSeconds`
- `endSeconds`
- `text`
- `summary`
- `concepts`
- `difficulty`
- `embedding`
- `createdAt`

### `youtube_research_coverage`

Maps objectives to candidates and segments.

Key fields:

- `id`
- `runId`
- `objectiveId`
- `candidateId`
- `segmentId` nullable
- `coverageScore`
- `confidence`
- `rationale`
- `limitations`
- `createdAt`

### `youtube_research_plan_item`

Stores the reviewable learning path.

Key fields:

- `id`
- `runId`
- `sectionTitle`
- `lessonTitle`
- `lessonDescription`
- `objectiveIds`
- `candidateId`
- `segmentId` nullable
- `startSeconds` nullable
- `endSeconds` nullable
- `order`
- `estimatedDurationSeconds`
- `teacherEdited`

## API Proposal

### Routes

Mount under a single root segment in `apps/api/src/app.ts`:

```ts
.route('/youtube-research', youtubeResearchRouter)
```

Route files:

- `apps/api/src/routes/youtube-research/index.ts`
- `apps/api/src/routes/youtube-research/research.ts`

Endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/youtube-research/runs` | Create research run from goal. |
| `GET` | `/youtube-research/runs` | List org research runs. |
| `GET` | `/youtube-research/runs/:runId` | Get run details, candidates, coverage, and plan. |
| `POST` | `/youtube-research/runs/:runId/start` | Queue background research. |
| `POST` | `/youtube-research/runs/:runId/cancel` | Cancel active run. |
| `POST` | `/youtube-research/runs/:runId/refine` | Add teacher instruction or targeted gap research. |
| `PUT` | `/youtube-research/runs/:runId/plan` | Save teacher-edited plan. |
| `POST` | `/youtube-research/runs/:runId/publish` | Publish approved plan to course. |
| `POST` | `/youtube-research/runs/:runId/candidates` | Add teacher-provided video candidate. |
| `PATCH` | `/youtube-research/runs/:runId/candidates/:candidateId` | Select, reject, or update candidate. |

### Validation

Add schemas under:

- `packages/utils/src/validation/youtube-research/youtube-research.ts`
- `packages/utils/src/validation/youtube-research/index.ts`

### Queries

Direct database access belongs under:

- `packages/db/src/queries/youtube-research/`

### Services

Business orchestration belongs under:

- `apps/api/src/services/youtube-research/`

Shared non-HTTP logic that jobs also need can live under:

- `packages/core/src/services/youtube-research/`

## Worker Pipeline

Add a dedicated queue payload and processor:

- `packages/jobs/src/payloads/youtube-research.ts`
- `packages/jobs/src/enqueue/youtube-research.ts`
- `apps/jobs/src/workers/youtube-research.ts`
- `apps/jobs/src/processors/youtube-research/run-research.ts`

Pipeline:

1. `decompose-goal`
2. `search-youtube`
3. `enrich-candidates`
4. `rank-candidates`
5. `ingest-transcripts`
6. `segment-transcripts`
7. `embed-segments`
8. `score-coverage`
9. `build-plan`
10. `persist-review-artifacts`

Each step should be idempotent and write a job ledger entry so retries do not duplicate work or repeat expensive provider calls unnecessarily.

## AI Architecture

Use a staged model approach:

| Stage | Model Class | Notes |
| --- | --- | --- |
| Goal decomposition | cheaper structured-output model | Small prompt, JSON output. |
| Metadata ranking | embeddings plus small model | Avoid transcript spend. |
| Segment summarization | cheap or batch model | Run per transcript chunk. |
| Coverage scoring | small model with structured output | Objective-by-segment scoring. |
| Path synthesis | stronger model | Needs planning quality, but only sees compressed artifacts. |
| Quiz generation | existing course assistant patterns | Ground questions in selected segments. |

Hard constraints:

- Do not send all candidate full transcripts to a large model.
- Do not include raw transcript text in final synthesis if segment summaries and coverage records are sufficient.
- Use structured outputs for every internal scoring/planning step.
- Persist prompt inputs and outputs only according to privacy and retention policy.

## Cost Controls

Required controls:

- Per-run max YouTube search calls.
- Per-run max transcript minutes.
- Per-run max candidate videos for deep analysis.
- Per-run max input and output tokens.
- Per-org monthly research budget.
- Plan-tier gates for number of runs and deep analysis depth.
- Cache by video ID, transcript source hash, segment hash, and objective hash.
- Stop early when coverage is already sufficient.
- Warn teacher before expensive follow-up research.

Default MVP budget target:

| Item | Target |
| --- | --- |
| Candidate discovery | Up to 50 videos |
| Transcript ingestion | Up to 12 videos |
| Deep analysis | Up to 8 videos |
| Selected output | 3 to 10 lessons |
| Run time | Under 5 minutes for common topics |
| Manual review | Required before publish |

## Permissions and Security

- Only org members with course creation or course editing permission can create research runs.
- Publishing into an existing course requires course team-member permission.
- Research data must be scoped by `organizationId`.
- Candidate and transcript caches shared across orgs need explicit privacy review; v1 should default to org-scoped caches unless a safe global cache policy is approved.
- OAuth tokens for YouTube caption access, if added, must be stored as secrets and scoped to authorized channels only.
- Generated content must be marked as AI-generated where the existing product requires it.

## Compliance and Content Policy

Before production launch, resolve:

- Whether ClassroomIO may retrieve, store, and analyze third-party YouTube transcripts from any chosen provider.
- Whether transcripts are stored long-term, temporarily, or only as derived summaries.
- Whether audio transcription of third-party YouTube videos is allowed.
- How to handle creator attribution.
- How to respond to removed, private, or non-embeddable videos after publish.
- Whether generated lesson notes can quote transcript text and what quote limits apply.

V1 policy recommendation:

- Embed videos from YouTube instead of copying video content.
- Store video metadata and teacher-approved course structure.
- Store transcript-derived summaries and coverage records.
- Store raw third-party transcripts only when provider policy and legal review approve it.
- Provide clear attribution to video title and channel in lesson metadata.

## Observability

Track per run:

- stage timings
- YouTube API calls and quota usage
- candidate count per query
- transcript availability rate
- transcript provider
- transcript minutes processed
- model IDs
- input/output/embedding tokens
- estimated cost
- cache hit rate
- number of warnings
- publish result

Track product quality:

- teacher approval rate
- average edits before publish
- videos rejected by teacher
- coverage gaps per run
- published course completion rate
- learner quiz performance
- learner drop-off by lesson

## Failure States

| Failure | User-Facing Behavior |
| --- | --- |
| YouTube API quota exhausted | Run pauses with retry guidance and partial candidates. |
| No videos found | Show search queries and let teacher edit goal. |
| Transcripts unavailable | Continue with metadata-only candidates and low confidence. |
| Video not embeddable | Exclude from default plan unless teacher explicitly keeps it as an external link. |
| AI budget exceeded | Stop at current stage and show partial results. |
| Provider error | Retry with backoff, then mark stage warning. |
| Course publish failure | Keep approved plan and allow retry. |

## MVP Scope

MVP should ship the smallest useful version:

1. Teacher starts a YouTube research run from a goal.
2. System discovers and enriches YouTube candidates.
3. System does metadata ranking and transcript analysis only where an approved transcript provider is available.
4. System produces a reviewable path with selected videos or timestamp ranges.
5. Teacher can edit the path.
6. Teacher can publish to a new self-paced course.
7. System tracks cost, warnings, and transcript availability.

MVP can defer:

- learner-led research
- global cross-org transcript cache
- YouTube OAuth for owned-channel captions
- clip creation
- advanced channel reputation scoring
- automatic replacement when a video disappears
- multi-language transcript translation
- mobile-specific review UI polish beyond responsive basics

## Implementation Plan

### Phase 1: Foundations

- Add validation schemas.
- Add DB tables and queries.
- Add service shell for research run lifecycle.
- Add routes for create, list, get, start, cancel.
- Add job payload and empty worker pipeline.
- Add dashboard run list and create form.

### Phase 2: Discovery and Metadata Ranking

- Add YouTube API client.
- Implement generated search queries.
- Fetch candidate metadata.
- Dedupe and rank candidates.
- Persist quota usage and metadata scores.
- Show candidate review UI.

### Phase 3: Transcript and Segment Analysis

- Add transcript provider interface.
- Implement `manual_upload` provider first for deterministic development.
- Add optional approved provider behind env flag.
- Segment transcripts.
- Generate summaries and embeddings.
- Score objective coverage.

### Phase 4: Plan Builder

- Build structured learning path from coverage records.
- Detect gaps and duplicates.
- Add teacher edit support.
- Add targeted refinement instructions.
- Persist approved plan.

### Phase 5: Publish

- Create course, sections, lessons, and YouTube video entries from approved plan.
- Generate optional lesson notes.
- Generate optional exercises using existing exercise patterns.
- Attach research run ID to published course metadata if schema permits.

### Phase 6: Hardening

- Add quota and token budget enforcement.
- Add retry and cancellation handling.
- Add cache reuse.
- Add integration tests for route/service/query boundaries.
- Add dashboard translations and formatting.
- Add metrics and admin visibility.

## Acceptance Criteria

### Research Run

- A teacher can create a run from a topic.
- The run progresses asynchronously through visible stages.
- The run can be canceled.
- The run records warnings and cost usage.

### Candidate Discovery

- The system can discover YouTube videos for generated queries.
- Duplicate videos are removed.
- Candidate metadata is persisted.
- Candidates have a metadata score and ranking rationale.

### Transcript Analysis

- Videos with available transcripts are segmented.
- Segments are scored against objectives.
- Videos without transcripts remain visible with low-confidence status.

### Review

- Teacher can see the proposed learning path.
- Teacher can remove or reorder items.
- Teacher can inspect coverage gaps.
- Teacher can approve the final path.

### Publish

- Approved path can publish into a self-paced course.
- Published lessons include YouTube links and timestamp metadata.
- Optional quizzes can be generated from selected segments.
- The original research run remains available for audit.

## Open Questions

1. Should this be a new course creation option, an AI assistant mode, or both?
2. What transcript providers are acceptable for third-party public YouTube videos?
3. Should raw transcripts be stored, or should we store only summaries, embeddings, and coverage records?
4. Should users be able to bring their own YouTube API key or transcript provider key in self-hosted mode?
5. Should generated YouTube courses be allowed on free plans?
6. How much should one research run cost internally before requiring confirmation?
7. Should learners see AI-generated notes, or only teacher-approved lesson content?
8. How should the system handle videos that become private or unavailable after publish?
9. Should orgs be able to maintain approved and blocked channel lists?
10. Is this feature part of Study from Source long-term, or a sibling product surface?

## Related Files and References

- [Study from Source PRD](/Users/rotimibest/_pros/classroomio/prd/study-from-source/README.md)
- [AI Course Assistant PRD](</Users/rotimibest/_pros/classroomio/prd/ai-course-assistant [DONE]/README.md>)
- [Asset service](/Users/rotimibest/_pros/classroomio/packages/core/src/services/assets/assets.ts)
- [Uploaded video transcription processor](/Users/rotimibest/_pros/classroomio/apps/jobs/src/processors/media/transcribe-audio.ts)
- [Course generation runner](/Users/rotimibest/_pros/classroomio/packages/core/src/services/agent/course-generation-runner.ts)
- [YouTube link form utility](/Users/rotimibest/_pros/classroomio/packages/ui/src/custom/youtube-link-form/youtube-link-utils.ts)
