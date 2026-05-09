---
name: Study from Source
overview: Add a Study from Source course type and source-study activity type that convert documents, webpages, and pasted text into structured learning experiences with AI-generated lessons, checkpoints, quizzes, and completion evidence.
todos:
  - id: prd-review
    content: Finalize scope, naming, source limits, and pricing gates
    status: pending
  - id: source-model
    content: Add persistent source, extraction, and source segment data model
    status: pending
  - id: course-type
    content: Add STUDY_FROM_SOURCE course type and course creation flow
    status: pending
  - id: activity-type
    content: Add source-study activity type for smaller document or webpage readings
    status: pending
  - id: ingestion
    content: Implement upload, URL fetch, pasted text ingestion, extraction, and source snapshots
    status: pending
  - id: ai-planning
    content: Implement AI outline generation, lesson breakdown, and teacher review workflow
    status: pending
  - id: publish
    content: Publish approved generated outlines into lessons and exercises
    status: pending
  - id: learner-reader
    content: Build learner source reader with progress, active-time, and completion tracking
    status: pending
  - id: assessments
    content: Generate source-grounded quiz questions and completion rules
    status: pending
  - id: reporting
    content: Add teacher progress, completion evidence, and source coverage reports
    status: pending
isProject: false
---

# Study from Source PRD

## Status

- Draft

## Date

- April 30, 2026

## Purpose

Add **Study from Source** as both:

1. a **course type** for turning larger source material into a full course with AI-generated lessons and assessments
2. an **activity type** for assigning a smaller source, such as a blog post or short PDF, inside an existing course and verifying that learners studied it

The product should support uploaded documents, webpage links, and pasted text. The AI agent should analyze the source, break it into teachable units, generate testable checkpoints, and produce learner-facing content that can be reviewed before publish.

Detailed engineering breakdown: [implementation-plan.md](/Users/rotimibest/_pros/classroomio/prd/study-from-source/implementation-plan.md).

## Problem Statement

Teachers, trainers, and operators often start from existing material: policies, manuals, papers, webpages, blog posts, SOPs, and handbooks. Today they must manually convert that material into lessons and exercises, and there is no strong way to verify that a learner actually studied a standalone source.

Current gaps:

- no dedicated course type for source-derived learning
- no source ingestion model that handles documents, URLs, and pasted text under one workflow
- no persistent source segmentation or source-to-lesson traceability
- no AI workflow that proposes lessons from source material before creating course content
- no smaller source-study activity for "read this and prove you understood it"
- no completion evidence that combines source engagement, quiz performance, and optional attestation

## Executive Summary

**Study from Source** lets a teacher provide source material and choose one of two paths:

| Path | Best For | Output |
| --- | --- | --- |
| `STUDY_FROM_SOURCE` course type | Long documents, manuals, policy packs, research papers, detailed webpages, documentation hubs | A full self-paced course with generated lessons, optional sections, quizzes, and source coverage reports |
| Source-study activity type | Short PDFs, articles, policy updates, blog posts, one-off reading assignments | One activity that displays the source and generates a quiz covering the key subject matter |

Both paths reuse the same source ingestion, extraction, AI analysis, quiz generation, and completion evidence primitives.

## Product Positioning

### Course Type

The course type is for cases where the source itself should become the course.

Examples:

- "Turn this onboarding handbook into a course."
- "Make a course from this security policy."
- "Break this research paper into lessons with checks for understanding."
- "Create training from this webpage documentation."

The AI output is a reviewable course plan:

- course title and description
- lessons generated from source chapters or inferred topics
- optional sections if the source is large enough
- lesson content summaries or explanations
- lesson-level quizzes or checkpoints
- final quiz if configured
- source coverage map

### Activity Type

The activity type is for cases where the source belongs inside another course.

Examples:

- "Read this blog post and answer questions."
- "Review this updated policy PDF."
- "Study this external article before the next lesson."

The AI output is one learner activity:

- source viewer
- optional short summary
- generated quiz covering the key subject matter
- completion rule based on engagement and score
- teacher-facing evidence that the learner opened, progressed through, and passed the check

## Goals

1. Add a first-class `STUDY_FROM_SOURCE` course type.
2. Add a reusable source-study activity type for smaller sources.
3. Support source inputs from uploaded files, webpage URLs, and pasted text.
4. Preserve source snapshots so generated content remains auditable even if a webpage changes.
5. Generate an editable course plan before creating lessons or exercises.
6. Create lessons from source segments, not from unstructured whole-document prompts.
7. Generate quiz questions that are grounded in specific source segments.
8. Track learner engagement with the source and completion evidence.
9. Keep teacher review mandatory before publishing AI-generated course content in v1.
10. Reuse existing lessons, sections, exercises, submissions, and course progress where possible.

## Non-Goals (v1)

- Proctored exams or identity verification
- Full plagiarism detection for written reflections
- Perfect extraction of complex tables, formulas, scanned PDFs, or diagrams
- Multi-source knowledge graph or semantic search across an entire org
- Real-time collaborative editing of generated outlines
- Automatic publishing without teacher review
- Full website crawling beyond explicitly provided URLs
- Video ingestion, YouTube transcript ingestion, or podcast/audio ingestion
- Compliance retake/expiry lifecycle; that belongs to the compliance course type

## Core Product Decisions

1. The feature is named **Study from Source**.
2. The course type should be `STUDY_FROM_SOURCE`.
3. The activity type should be source-study, not document-study, because URLs and pasted text are first-class inputs.
4. Course generation creates lessons by default. Sections are optional and only used when the source naturally needs grouping.
5. The activity type does not create multiple lessons. It displays one source and generates one quiz/checkpoint over the key subject matter.
6. AI-generated output is always draft/reviewable before learner-facing publish in v1.
7. Source snapshots and extracted text are persisted for auditability.
8. Completion should be based on evidence, not only an "opened" event.

## Current-State Audit

| Capability | Current State | Notes |
| --- | --- | --- |
| Course types | `SELF_PACED`, `LIVE_CLASS`, `COMPLIANCE` | Add `STUDY_FROM_SOURCE` to the existing enum |
| Course content | Sections, lessons, and exercises exist | Course type can publish into current content model |
| Course grouping | Course metadata supports `isContentGroupingEnabled` | Use sections only when needed |
| Lesson documents | Lessons already store document attachments | Useful for source display, but not enough for source segmentation |
| Assets | Asset manager supports `document` kind | Reuse for uploaded source files |
| AI assistant document upload | Exists for course chat uploads | Useful reference, but Study from Source needs persistent source records |
| AI course assistant PRD | Covers in-course chat and document-to-course planning | Study from Source should reuse patterns but has a dedicated product surface |
| Course import draft schema | Exists for structured sections, lessons, lesson languages, and exercises | Good foundation for publish pipeline |
| Exercises/submissions | Existing exercises and auto-grading exist | Reuse for generated quizzes where possible |
| Compliance course type | Already exists in schema/code | Distinct from Study from Source; only combine later if needed |

Data references:

- [packages/db/src/schema.ts](/Users/rotimibest/_pros/classroomio/packages/db/src/schema.ts)
- [packages/utils/src/validation/course-import/course-import.ts](/Users/rotimibest/_pros/classroomio/packages/utils/src/validation/course-import/course-import.ts)
- [apps/api/src/services/agent/document.ts](/Users/rotimibest/_pros/classroomio/apps/api/src/services/agent/document.ts)
- [apps/api/src/routes/agent/upload.ts](/Users/rotimibest/_pros/classroomio/apps/api/src/routes/agent/upload.ts)
- [prd/ai-course-assistant [DONE]/README.md](/Users/rotimibest/_pros/classroomio/prd/ai-course-assistant%20[DONE]/README.md)
- [prd/compliance-training-platform [DONE]/README.md](/Users/rotimibest/_pros/classroomio/prd/compliance-training-platform%20[DONE]/README.md)

## User Personas

### Persona A: Teacher

Wants to turn a PDF, article, or textbook chapter into lessons and quizzes without manually copying content into the course builder.

### Persona B: Training Operator

Wants employees to study policies, handbooks, SOPs, and process docs, then prove they understood the material.

### Persona C: Course Creator

Wants to convert long-form source material into a polished self-paced course with clear lessons, objectives, and assessments.

### Persona D: Learner

Wants a clear reading/study experience with short checks for understanding and transparent progress.

## Jobs To Be Done

1. Upload or link source material and turn it into structured learning content.
2. Break source content into sensible lessons.
3. Generate testable questions from the important points in the source.
4. Review and edit AI-generated structure before publishing.
5. Assign a small source reading inside an existing course.
6. Verify that a learner engaged with the source and understood key material.
7. See which source parts are covered by lessons and quizzes.

## Source Types

### Supported in v1

| Source Type | Input | Requirements |
| --- | --- | --- |
| File upload | PDF, DOCX, PPTX, TXT, Markdown | File stored as asset where possible; extracted text persisted |
| Webpage URL | Single URL | Fetch server-side, extract readable article/body content, store snapshot |
| Pasted text | Plain text or Markdown | Store directly with source metadata |

### Out of Scope for v1

- website crawling across many pages
- private webpages requiring login
- scanned PDF OCR
- Google Drive document import
- YouTube/video transcript ingestion
- ZIP packages or SCORM

## Source Lifecycle

```
Draft source created
  ↓
File uploaded / URL fetched / text pasted
  ↓
Text extracted and normalized
  ↓
Source segmented
  ↓
AI generates outline or activity quiz
  ↓
Teacher reviews and edits
  ↓
Teacher publishes
  ↓
Learners study source-derived content
  ↓
Progress, quiz score, and completion evidence recorded
```

## Feature Requirements

### 1. Shared Source Model

#### Purpose

Create one persistence model for documents, webpages, and pasted text so both the course type and activity type use the same ingestion and AI pipeline.

#### Requirements

**SFS-SRC-1: Source Table**

Add a `study_source` table:

| Field | Type | Description |
| --- | --- | --- |
| `id` | uuid | Source ID |
| `organizationId` | uuid | Owning org |
| `courseId` | uuid nullable | Course associated with source |
| `lessonId` | uuid nullable | Set when source is used by one lesson/activity |
| `activityId` | uuid nullable | Set if a separate activity table is introduced |
| `createdByProfileId` | uuid | Creator |
| `type` | enum | `file`, `webpage`, `text` |
| `status` | enum | `draft`, `extracting`, `ready`, `failed`, `archived` |
| `title` | text | Display title |
| `sourceUrl` | text nullable | Original webpage URL |
| `assetId` | uuid nullable | Uploaded asset reference |
| `mimeType` | text nullable | Source MIME type |
| `rawText` | text | Extracted or pasted text |
| `normalizedText` | text | Cleaned learner/AI text |
| `wordCount` | integer | Source word count |
| `metadata` | jsonb | Fetch/extraction metadata |
| `createdAt` / `updatedAt` | timestamp | Audit fields |

**SFS-SRC-2: Source Segment Table**

Add a `study_source_segment` table:

| Field | Type | Description |
| --- | --- | --- |
| `id` | uuid | Segment ID |
| `sourceId` | uuid | Parent source |
| `parentSegmentId` | uuid nullable | Optional hierarchy |
| `order` | integer | Segment ordering |
| `kind` | enum | `chapter`, `section`, `paragraph`, `page`, `inferred_topic` |
| `title` | text nullable | Heading or inferred title |
| `text` | text | Segment text |
| `startLocator` | jsonb | Page, heading, text offset, URL fragment |
| `endLocator` | jsonb | Page, heading, text offset, URL fragment |
| `metadata` | jsonb | AI/extraction details |

**SFS-SRC-3: Generated Draft Tables**

Add `study_source_generation_draft` for reviewable AI output before publish:

| Field | Type | Description |
| --- | --- | --- |
| `id` | uuid | Draft ID |
| `sourceId` | uuid | Primary source |
| `courseId` | uuid nullable | Existing course for activity generation |
| `lessonId` | uuid nullable | Existing lesson if regenerating an activity |
| `createdByProfileId` | uuid | Creator |
| `kind` | enum | `course_outline`, `activity_quiz`, `lesson_regeneration`, `quiz_regeneration` |
| `status` | enum | `draft`, `approved`, `publishing`, `published`, `failed`, `archived` |
| `inputSettings` | jsonb | Generation settings |
| `output` | jsonb | Proposed outline, lesson content, questions, and mappings |
| `warnings` | jsonb | Truncation, extraction, or quality warnings |
| `publishedCourseId` | uuid nullable | Created course when kind is `course_outline` |
| `publishedLessonId` | uuid nullable | Created/updated lesson when relevant |
| `publishedExerciseId` | uuid nullable | Created quiz/exercise when relevant |
| `createdAt` / `updatedAt` | timestamp | Audit fields |

This keeps AI output reviewable and versioned before it touches learner-facing content.

**SFS-SRC-4: Source Coverage Table**

Add `study_source_coverage` to map source segments to generated content:

| Field | Type | Description |
| --- | --- | --- |
| `id` | uuid | Coverage ID |
| `sourceId` | uuid | Source |
| `segmentId` | uuid | Source segment |
| `courseId` | uuid | Course |
| `lessonId` | uuid nullable | Generated lesson |
| `exerciseId` | uuid nullable | Generated exercise |
| `questionId` | uuid nullable | Generated question |
| `coverageType` | enum | `lesson_content`, `quiz_question`, `summary`, `reflection_prompt` |
| `confidence` | numeric nullable | AI/source mapping confidence |
| `createdAt` | timestamp | Audit field |

**SFS-SRC-5: Source Snapshot**

For webpage sources:

- store the fetched URL, final resolved URL, HTTP status, content type, fetched timestamp, and readable extracted content
- do not rely on live webpage content for learner playback or quiz auditing
- show the original URL as the source citation

**SFS-SRC-6: Source Limits**

Initial limits:

- uploaded file max: 10MB for Study from Source
- extracted text max per source: 150,000 characters in v1
- URL fetch timeout: 15 seconds
- URL max response size: 10MB
- one URL per source in v1

If the source is truncated, the UI must make that visible before generation.

### 2. Study from Source Course Type

#### Purpose

Let teachers create a complete course from one or more source materials.

#### Requirements

**SFS-COURSE-1: Course Type Enum**

- Add `STUDY_FROM_SOURCE` to `COURSE_TYPE`
- It behaves like a self-paced course for learner delivery, progress, and exercises
- It carries extra source-generation metadata in a dedicated table or course metadata

**SFS-COURSE-2: Course Creation Entry**

Add a course creation path:

```
New Course -> Study from Source
```

The teacher can:

- upload a source file
- enter a webpage URL
- paste source text
- add a title and optional prompt/instructions
- choose whether the AI should create lessons only or sections + lessons
- choose quiz strategy: per lesson, final quiz only, or both

**SFS-COURSE-3: AI Outline Generation**

The system generates a proposed plan:

```json
{
  "courseTitle": "Workplace Security Handbook",
  "courseDescription": "A source-based training course on core security policies.",
  "structure": {
    "usesSections": true,
    "sections": [
      {
        "title": "Access Control",
        "lessons": [
          {
            "title": "Password and MFA Requirements",
            "summary": "Explains password standards, MFA enrollment, and account recovery.",
            "sourceSegmentIds": ["segment_1", "segment_2"],
            "learningObjectives": [
              "Explain why MFA is required",
              "Identify acceptable password practices"
            ],
            "assessment": {
              "questionCount": 4,
              "questionTypes": ["radio", "checkbox", "short_answer"]
            }
          }
        ]
      }
    ]
  }
}
```

**SFS-COURSE-4: Lessons Are the Primary Output**

- The course type creates lessons as the primary learner-facing units
- Sections are optional
- If the source has natural chapters or is long enough to need grouping, the AI should propose sections
- If the source is moderate length, the AI should create a flat lesson list

**SFS-COURSE-5: Teacher Review**

Before publish, the teacher can:

- rename course, sections, and lessons
- merge or split lessons
- remove generated lessons
- adjust quiz count and passing score
- regenerate a lesson or quiz
- view source segments behind each lesson
- approve generation into real course content

**SFS-COURSE-6: Publish Behavior**

Publishing creates:

- course shell with type `STUDY_FROM_SOURCE`
- optional sections
- lessons with generated content in lesson language content
- exercises attached to lessons or course as configured
- questions/options using existing exercise models
- source coverage records mapping source segments to lessons and questions

**SFS-COURSE-7: Completion Rule**

Default completion for Study from Source courses:

- all required lessons completed
- required generated quizzes passed
- optional final attestation checked if enabled

The course should reuse existing self-paced completion and auto-grading behavior where possible.

### 3. Source-Study Activity Type

#### Purpose

Let a teacher add one source reading/checkpoint inside an existing course without generating a whole course.

#### Product Difference From Course Type

| Capability | Course Type | Activity Type |
| --- | --- | --- |
| Input size | Larger source | Smaller source |
| Output | Multiple lessons, optional sections, quizzes | One activity with source viewer and quiz |
| Course structure change | Creates a course structure | Adds one item inside an existing course |
| AI breakdown | Break into lessons | Extract key subject matter and quiz it |
| Learner experience | Move through generated lessons | Read source, answer quiz, complete |

#### Requirements

**SFS-ACT-1: Activity Entry**

Add a content creation option:

```
Add Content -> Study from Source
```

This creates a source-study activity in the current course, either:

- as a specialized lesson variant in v1, or
- as a new content type if the content model is expanded beyond section/lesson/exercise

Recommendation for v1:

- implement as a lesson with source-study metadata and an attached generated exercise
- avoid adding a fourth content type until the product needs a generalized activity model
- persist activity-specific configuration in a `study_source_activity` table linked to `lessonId`, `sourceId`, and generated `exerciseId`

Suggested `study_source_activity` fields:

| Field | Type | Description |
| --- | --- | --- |
| `id` | uuid | Activity ID |
| `courseId` | uuid | Course |
| `lessonId` | uuid | Lesson that renders the activity |
| `sourceId` | uuid | Source used by the activity |
| `exerciseId` | uuid nullable | Generated quiz/checkpoint |
| `title` | text | Learner-facing activity title |
| `status` | enum | `draft`, `published`, `archived` |
| `requiredProgressPercent` | integer | Default 90 |
| `minimumActiveTimeSeconds` | integer nullable | Optional engagement requirement |
| `passingScorePercent` | integer | Default 80 |
| `requiresAttestation` | boolean | Whether learner must attest |
| `settings` | jsonb | Reader display and generation settings |
| `createdAt` / `updatedAt` | timestamp | Audit fields |

**SFS-ACT-2: Activity Source Input**

Teacher can:

- upload a file
- paste a webpage URL
- paste text
- set title
- choose question count
- choose passing score
- enable or disable attestation

**SFS-ACT-3: AI Output**

The AI generates:

- short source summary for teacher review
- key subject matter list
- quiz questions covering the source
- optional reflection prompt
- source coverage map for each question

The activity does not break the source into multiple lessons.

**SFS-ACT-4: Learner Display**

Learner sees:

- source title and metadata
- embedded source viewer or normalized readable text
- progress indicator
- generated quiz
- optional attestation checkbox

For webpage sources, show the stored snapshot and link to the original source.

**SFS-ACT-5: Completion Rule**

Default completion:

- source opened
- minimum source progress reached, default 90%
- minimum active study time reached, default disabled for v1 unless configured
- quiz submitted and passed
- attestation checked if enabled

### 4. AI Generation Requirements

#### Purpose

Ensure AI output is source-grounded, reviewable, and useful for learning.

#### Requirements

**SFS-AI-1: Segment-First Generation**

The AI must operate on source segments, not only a full raw text blob. The pipeline:

1. extract text
2. normalize text
3. segment source
4. generate outline or activity quiz from segments
5. store mappings from generated output back to segments

**SFS-AI-2: Grounding**

Each generated lesson and question should reference source segment IDs.

This enables:

- source coverage reports
- teacher review of generated claims
- future regeneration of a single lesson/question
- auditability when a learner disputes a quiz item

**SFS-AI-3: Question Types**

v1 should generate only question types that can be reliably auto-graded:

- radio
- checkbox
- true/false if available in the question-type system
- short answer only if answer matching/grading is reliable enough

Manual grading question types are optional and should be disabled by default.

**SFS-AI-4: Quality Controls**

The generation prompt should require:

- no questions that rely on unstated assumptions
- no questions about trivial wording unless configured
- answer explanations for teacher review
- no unsupported citations
- direct source segment mapping for every question

**SFS-AI-5: Regeneration**

Teachers can regenerate:

- entire course outline
- one lesson
- one lesson quiz
- one activity quiz

Regeneration preserves the source record and creates a new generated draft version.

### 5. Learner Tracking and Evidence

#### Purpose

Track enough behavior to support a reasonable "studied it" claim without pretending that passive reading telemetry proves comprehension.

#### Requirements

**SFS-TRACK-1: Study Events**

Add `study_source_event` table:

| Event | Description |
| --- | --- |
| `opened` | Learner opened source/activity |
| `segment_viewed` | Learner viewed a source segment |
| `progress_updated` | Learner reached a progress threshold |
| `active_time_recorded` | Active time heartbeat |
| `quiz_started` | Quiz opened |
| `quiz_submitted` | Quiz submitted |
| `attestation_checked` | Learner confirmed they studied the source |
| `completed` | Completion rule satisfied |

**SFS-TRACK-2: Progress Aggregates**

Add `study_source_progress` table:

| Field | Description |
| --- | --- |
| `sourceId` | Source |
| `courseId` | Course |
| `lessonId` | Lesson/activity if applicable |
| `exerciseId` | Generated quiz if applicable |
| `profileId` | Learner |
| `progressPercent` | Source progress |
| `activeTimeSeconds` | Active foreground time |
| `quizScorePercent` | Latest or best quiz score |
| `completedAt` | Completion timestamp |
| `evidence` | JSON summary of completion signals |

**SFS-TRACK-3: Evidence Language**

Teacher-facing UI should say:

- "Completed study requirements"
- "Passed source check"
- "Viewed 92% of source and scored 85%"

Avoid claiming:

- "guaranteed they read every word"
- "proved they understood everything"

### 6. Reporting

#### Requirements

**SFS-REPORT-1: Course Source Coverage**

For Study from Source courses, show:

- total source segments
- segments covered by lessons
- segments covered by quiz questions
- uncovered segments
- generated lessons per source

**SFS-REPORT-2: Learner Completion Report**

For both course and activity paths, show:

- learner
- status
- source progress
- active time
- quiz score
- attempts
- completion timestamp
- attestation status

**SFS-REPORT-3: Export**

Support CSV export of learner completion evidence.

## UX Flows

### Flow 1: Create Study from Source Course

```
1. Teacher clicks New Course
2. Selects Study from Source
3. Adds source: upload, URL, or pasted text
4. Chooses generation settings
5. System extracts source and shows status
6. AI proposes course outline
7. Teacher reviews, edits, and approves
8. System creates course, lessons, and exercises
9. Teacher previews and publishes course
```

### Flow 2: Add Source-Study Activity

```
1. Teacher opens existing course content editor
2. Clicks Add Content
3. Selects Study from Source
4. Adds short source
5. Chooses question count and passing score
6. AI generates source summary and quiz
7. Teacher reviews and publishes
8. Learner studies source and completes quiz
9. Teacher sees completion evidence
```

### Flow 3: Learner Completes Activity

```
1. Learner opens source-study activity
2. Source viewer records opened event
3. Learner progresses through content
4. Learner answers generated quiz
5. System grades quiz
6. If completion rule is satisfied, activity is complete
7. Completion evidence appears in teacher report
```

## Proposed API Surface

### Source Management

- `POST /study-sources`
- `GET /study-sources/:sourceId`
- `POST /study-sources/:sourceId/extract`
- `POST /study-sources/:sourceId/segment`
- `DELETE /study-sources/:sourceId`

### Course Type Generation

- `POST /course/study-from-source/drafts`
- `GET /course/study-from-source/drafts/:draftId`
- `PUT /course/study-from-source/drafts/:draftId`
- `POST /course/study-from-source/drafts/:draftId/regenerate`
- `POST /course/study-from-source/drafts/:draftId/publish`

### Activity Generation

- `POST /course/:courseId/source-study-activities`
- `GET /course/:courseId/source-study-activities/:activityId`
- `PUT /course/:courseId/source-study-activities/:activityId`
- `POST /course/:courseId/source-study-activities/:activityId/generate-quiz`
- `POST /course/:courseId/source-study-activities/:activityId/publish`

### Learner Tracking

- `POST /course/:courseId/study-sources/:sourceId/events`
- `GET /course/:courseId/study-sources/:sourceId/progress`
- `GET /course/:courseId/study-sources/:sourceId/report`

Route names can be adjusted during implementation to match existing course route grouping.

## Validation Schemas

Add schemas under:

- `packages/utils/src/validation/study-source/study-source.ts`
- `packages/utils/src/validation/study-from-source/study-from-source.ts`

Core schema groups:

- source create
- URL source create
- file source finalize
- pasted text source create
- course generation settings
- course generated draft update
- source-study activity create/update
- study event create
- report query filters

## Dashboard Feature Placement

Add frontend modules under:

- `apps/dashboard/src/lib/features/study-source/`
- `apps/dashboard/src/lib/features/course/components/content/` for the create entry
- `apps/dashboard/src/lib/features/course/pages/` if a dedicated source report page is needed

Request/response types must live in the feature `utils/types.ts` file and be inferred from API route types.

## Implementation Plan

### Phase 1: Shared Source Foundation

1. Add enums and DB tables for source, segment, event, progress, and generated draft metadata.
2. Add query modules under `packages/db/src/queries/study-source/`.
3. Add validation schemas.
4. Add source create/get/delete routes.
5. Reuse asset upload and document extraction where possible.

### Phase 2: Ingestion

1. Support file upload source.
2. Support pasted text source.
3. Support webpage URL fetch and readable-text extraction.
4. Store source snapshots and extraction metadata.
5. Add extraction status UI.

### Phase 3: Source Segmentation

1. Segment by document headings/pages where available.
2. Segment webpages by headings and readable sections.
3. Use AI-assisted inferred segmentation only when deterministic structure is weak.
4. Store segment locators for citations and coverage.

### Phase 4: Study from Source Course Type

1. Add `STUDY_FROM_SOURCE` to course type enum.
2. Add course creation option.
3. Build AI outline generation endpoint.
4. Build teacher review UI.
5. Publish approved drafts into sections, lessons, lesson language content, and exercises.

### Phase 5: Source-Study Activity

1. Add `Study from Source` content creation option.
2. Implement as a lesson variant with source metadata and generated exercise in v1.
3. Build source reader UI.
4. Generate and review activity quiz.
5. Publish activity inside an existing course.

### Phase 6: Learner Tracking and Reports

1. Add event ingestion endpoint.
2. Add progress aggregation service.
3. Connect generated quiz submission to source completion.
4. Add teacher reports and CSV export.

## Acceptance Criteria

### Course Type

1. Teacher can create a `STUDY_FROM_SOURCE` course from a PDF, webpage URL, or pasted text.
2. AI proposes a reviewable course outline with lessons and optional sections.
3. Teacher can edit the proposed outline before publish.
4. Publishing creates real course content using existing lessons and exercises.
5. Generated questions are attached to source segments.
6. Learners can complete the generated course like a self-paced course.

### Activity Type

1. Teacher can add a source-study activity to an existing course.
2. Activity can use a file, URL, or pasted text.
3. AI generates a quiz that covers the key subject matter.
4. Learner can view the source and complete the quiz.
5. Completion requires progress and passing score by default.
6. Teacher can view completion evidence per learner.

### Source Handling

1. Source snapshots are persisted.
2. Webpage changes do not change an already-published activity or course.
3. Truncation and extraction failures are visible to teachers.
4. Source records are scoped to the organization and course permissions.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| AI generates inaccurate lesson content | Learners receive wrong material | Require teacher review, source mapping, and citations |
| Webpages are dynamic or copyrighted | Snapshot may be incomplete or legally sensitive | Store metadata, show original URL, let orgs control use policy |
| Source extraction fails on complex PDFs | Poor lesson generation | Show extraction preview and allow pasted text fallback |
| Activity tracking overclaims reading | Trust issue | Use careful evidence language and combine telemetry with quiz score |
| Adding a new content type is disruptive | Broad content model refactor | Implement activity as lesson variant in v1 |
| Token cost is high for large sources | Slow or expensive generation | Segment source, estimate cost before generation, allow truncation controls |

## Open Questions

1. Should Study from Source require a paid plan, or only source upload/AI generation?
2. Should URL fetching allow private/intranet URLs, or public URLs only?
3. Should teachers be able to include multiple sources in one Study from Source course in v1?
4. Should source-study activities appear as lessons, exercises, or a new content type in the learner sidebar?
5. What is the default passing score: 70%, 80%, or inherited from course settings?
6. Should generated questions include explanations visible to learners after submission?
7. Should source snapshots be downloadable by learners, or only viewable in-app?
