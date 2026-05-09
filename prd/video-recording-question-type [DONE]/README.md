# Video Recording Question Type PRD

## Status

- Done (shipped)

## Date

- April 29, 2026

## Purpose

Add a new exercise question type that lets students record a short video response directly in the browser. The student clicks "Start recording", sees a circular selfie-style camera frame with a timer UI, records within the teacher's configured duration limit, can retake the recording multiple times, and submits the final recording as the answer.

This is not a generic video upload question. Students must record inside ClassroomIO instead of choosing an existing video file from their device.

## Problem Statement

Current exercise question types support text, objective answers, links, and file uploads, but they do not support authentic spoken or visual responses captured at answer time.

Teachers need video responses for use cases such as:

1. Oral language assessments.
2. Reflection prompts.
3. Presentation practice.
4. Speaking assignments.
5. Student identity or presence checks for low-stakes activities.
6. Short self-introduction or portfolio responses.

Using generic file upload for this workflow is weaker because:

1. Students can upload pre-recorded or edited videos.
2. The teacher cannot control recording duration in the answer UI.
3. The experience is not optimized for quick mobile selfie responses.
4. Retake behavior is unclear.
5. The system cannot reliably guide capture, upload, and answer persistence as one flow.

## Product Thesis

A first-class video recording question type gives teachers richer student responses while keeping the experience constrained, simple, and assessment-friendly. The product should feel like recording a short circular selfie video message, not managing a media file.

## Current-State Audit

| Area | Current State | Gap |
| --- | --- | --- |
| Question type registry | `@cio/question-types` supports 12 question types | No `VIDEO_RECORDING` type |
| File upload question | Supports uploaded answer files | Allows choosing files, which is explicitly not this workflow |
| Media storage | Existing video presign and Cloudflare-compatible object storage paths exist | Needs answer-specific recording upload contract and metadata |
| Question renderers | `@cio/ui/custom/exercise-question` owns edit/take/preview/submission renderers | Needs recording-specific edit, take, preview, and submission renderers |
| Exercise submission | Answers serialize through shared answer codecs | Needs a video recording answer payload |
| Grading | Manual types route to manual grading | Video response must be manual grading required |
| Student UI | Existing take mode is form-like | Needs camera permission, timer, circular preview, stop, replay, retake, upload states |

## Data Sources Checked

- `packages/question-types/README.md`
- `packages/question-types/ADDING_A_QUESTION_TYPE.md`
- `packages/question-types/src/question-type-registry.ts`
- `packages/question-types/src/answer-data.ts`
- `packages/question-types/src/answer-codecs.ts`
- `packages/ui/src/custom/exercise-question/renderer-contract.ts`
- `packages/ui/src/custom/exercise-question/renderers/file-upload/`
- `apps/api/src/routes/course/presign.ts`
- `apps/api/src/utils/s3.ts`
- `prd/exercise-question-types [DONE]/README.md`
- `prd/media-manager [DONE]/README.md`
- `prd/media-manager [DONE]/decoupling.md`

## Primary Users

- Teachers creating exercises that require short video responses.
- Students recording responses on desktop or mobile browsers.
- Instructors, tutors, and admins reviewing submissions.

## Goals

1. Add a `VIDEO_RECORDING` exercise question type.
2. Let teachers configure a max recording duration per question.
3. Let students record directly from camera and microphone inside the answer UI.
4. Present a circular selfie-style video frame during recording and preview.
5. Show a clear timer and enforce the configured max duration.
6. Let students retake the recording multiple times before final submission.
7. Upload the final selected recording to Cloudflare-backed storage.
8. Store the uploaded recording's `assetId`, `storageKey`, and metadata as the student's answer.
9. Make the answer reviewable by teachers in submission review.
10. Keep this separate from the existing file upload question type.

## Non-Goals (v1)

- Uploading an existing video file from the device.
- In-browser video editing, trimming, filters, captions, or effects.
- Multi-clip recordings.
- Screen recording.
- Live teacher feedback during recording.
- Automatic speech transcription.
- AI scoring or content moderation.
- Proctoring-grade identity verification.
- Offline recording with later background sync.
- Mandatory one-take-only recording restrictions.

## Confirmed Product Decisions

1. The question type is recording-only, not upload-based.
2. Teachers configure the max duration per question.
3. Students can retake multiple times before submitting.
4. Only the final selected take is submitted as the answer.
5. Recording UI uses a circular video frame, similar to short selfie video messages.
6. The recording is uploaded to Cloudflare-backed storage after the student accepts the take.
7. The answer stores `storageKey`, `assetId`, and supporting metadata. Playback URLs are generated on demand.
8. The question requires manual grading.
9. Upload starts immediately after the student accepts a take, not when the full exercise is submitted.
10. Cleanup for superseded, abandoned, and expired recordings is in scope for v1.

## Open Product Decisions

1. Should v1 enforce a platform-wide maximum duration, such as 30, 60, 120, or 180 seconds?
2. Should students be allowed to delete a saved final recording before submitting the exercise?
3. Should failed uploads block the full exercise submission or only mark that question incomplete?
4. Should teachers see retake count metadata, or should retakes remain private to the student?
5. What retention window should be used before deleting superseded recording assets?

## User Stories

### Teacher Authoring

- As a teacher, I can choose "Video recording" from the question type picker.
- As a teacher, I can write the prompt and instructions for the recording.
- As a teacher, I can set the maximum recording duration.
- As a teacher, I can preview the student recording experience.
- As a teacher, I can see that video recording questions require manual grading.

### Student Recording

- As a student, I can grant camera and microphone permission.
- As a student, I can see myself in a circular video frame before recording.
- As a student, I can click "Start recording" to begin.
- As a student, I can see elapsed time and remaining time while recording.
- As a student, recording stops automatically at the max duration.
- As a student, I can stop early.
- As a student, I can replay my recording before accepting it.
- As a student, I can retake the video multiple times.
- As a student, I can submit only the take I accepted.
- As a student, I see upload progress and errors clearly.

### Teacher Review

- As a teacher, I can play the submitted video answer in the submission review screen.
- As a teacher, I can see duration, upload status, submitted time, and file metadata.
- As a teacher, I can grade the response manually and leave feedback.

## Functional Requirements

### FR-1: Question Type Registration

Add a new question type:

- Key: `VIDEO_RECORDING`
- Label: `Video recording`
- Auto-gradable: `false`
- Supports partial credit: `false`
- Manual grading required: `true`

The type must be added to:

- `@cio/question-types` keys and registry.
- DB `question_type` seed/reference data.
- Question type picker.
- Renderer contract.
- Dashboard translation labels.
- Submission review UI.

### FR-2: Authoring Settings

Teachers can configure:

- Prompt.
- Optional instructions.
- Points.
- Required/optional.
- Max recording duration in seconds.

Default settings:

```json
{
  "maxDurationSeconds": 60,
  "allowRetakes": true
}
```

Validation:

- `maxDurationSeconds` is required.
- `maxDurationSeconds` must be greater than `0`.
- `maxDurationSeconds` must not exceed the platform maximum.
- `allowRetakes` is always `true` in v1 and can be omitted from the UI if the product does not need a toggle.

### FR-3: Student Recording UI

The take renderer must include:

- Camera permission state.
- Microphone permission state.
- Circular live video preview.
- Start recording action.
- Stop recording action.
- Timer UI during recording.
- Automatic stop at max duration.
- Playback preview after recording.
- Accept/use recording action.
- Retake action.
- Upload progress state.
- Upload failure state with retry.

Recording states:

| State | Description |
| --- | --- |
| `idle` | No permission requested or no stream active |
| `permission_denied` | Browser denied camera or microphone |
| `ready` | Camera preview is active and user can start |
| `recording` | MediaRecorder is capturing video/audio |
| `recorded` | A local blob exists for preview |
| `uploading` | Accepted recording is uploading |
| `uploaded` | Cloudflare upload completed and answer is set |
| `failed` | Recording or upload failed |

### FR-4: Timer Behavior

The timer must show:

- Elapsed time.
- Remaining time.
- Max duration.

Rules:

- Timer starts when recording begins.
- Timer stops when the student clicks stop.
- Recording auto-stops when elapsed time reaches `maxDurationSeconds`.
- UI should warn visually in the final 10 seconds for recordings longer than 15 seconds.
- If the recording is shorter than 1 second, the UI should ask the student to record again.

### FR-5: Retake Behavior

Students can retake the video multiple times before submitting.

Rules:

- Retake discards the current local recording.
- Retake does not synchronously delete already-uploaded Cloudflare objects.
- The answer always points to the latest accepted and successfully uploaded recording.
- If the student records again after an upload, the UI must make clear that the new take replaces the previous answer after upload succeeds.
- v1 does not limit the number of retakes.
- Superseded uploaded takes must be marked for cleanup once a newer accepted take is successfully uploaded.

### FR-6: Upload Behavior

After the student accepts a recording:

1. Convert the captured recording blob to a supported video MIME type.
2. Request a video-recording upload URL and pending asset from the API.
3. Upload the blob to Cloudflare-backed object storage.
4. Complete the upload with duration, size, and MIME metadata.
5. Store the resulting answer payload with `assetId` and `storageKey`.
6. Show the uploaded state in the UI.

Recommended v1 upload timing:

- Upload immediately after the student accepts a take.
- Do not wait until the full exercise submit action, because large video uploads are more failure-prone than text answers.
- The exercise answer should not be considered complete until the accepted take has uploaded and the asset completion step has returned.

Upload constraints:

- Upload endpoint must require authentication.
- Upload endpoint must validate course/exercise/question access.
- Upload endpoint must enforce max duration metadata from the question settings where possible.
- Upload endpoint must restrict MIME types to browser-recordable video types.
- Upload endpoint must produce a storage key in a recording-specific namespace.
- Upload completion must create or finalize a media asset and return `assetId`.
- The API must not return or persist a long-lived playback URL as the answer.

### FR-7: Answer Payload

Store the final accepted recording as structured answer data.

Proposed answer data:

```typescript
export type VideoRecordingAnswerData = {
  type: 'VIDEO_RECORDING';
  assetId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  durationSeconds: number;
  recordedAt: string;
  uploadedAt: string;
  provider: 'cloudflare';
};

export type VideoRecordingAnswerResponseData = VideoRecordingAnswerData & {
  playbackUrl?: string;
};
```

Storage rules:

- `assetId` and `storageKey` are required and are the durable answer reference.
- `playbackUrl` is transient and must only be attached to API responses after access checks.
- Do not persist `playbackUrl` as the canonical answer.
- If thumbnail generation is implemented, store `thumbnailUrl` on the asset metadata, not as the primary answer reference.

### FR-8: Teacher Submission Review

Submission review must render:

- Video player.
- Playback URL generated on demand from `assetId` or `storageKey`.
- Duration.
- File size.
- Submitted timestamp.
- Manual grading controls.
- Feedback controls.

If the video cannot be loaded:

- Show a clear unavailable state.
- Offer retry by requesting a fresh playback URL.
- Preserve grading and feedback controls.

### FR-9: Validation and Grading

Submission validation:

- Required video recording questions are incomplete until an uploaded answer payload exists.
- Optional video recording questions can be skipped.
- Payload must include `assetId`, `storageKey`, `mimeType`, `size`, and `durationSeconds`.
- `durationSeconds` must be less than or equal to the configured `maxDurationSeconds` plus a small server tolerance.

Grading:

- Video recording questions are manual grading required.
- Exercises containing video recording questions cannot be fully auto-graded.
- Teachers can assign points and feedback in the existing manual grading flow.

### FR-10: Browser Compatibility

Use the browser `MediaRecorder` and `getUserMedia` APIs.

Supported baseline:

- Latest Chrome.
- Latest Edge.
- Latest Firefox.
- Latest Safari on macOS and iOS, subject to MediaRecorder support validation.

If recording is unsupported:

- Show a browser-not-supported message.
- Do not fall back to file upload in v1.

## UX Requirements

### Student Take Mode

The video recording area should feel lightweight and mobile-first:

- Circular camera frame.
- Centered face/selfie composition.
- Clear start and stop controls.
- Timer visible near the frame.
- Retake and use-recording actions after playback.
- Upload state shown inline, not as a separate modal.

Recommended layout:

1. Prompt and instructions.
2. Circular preview frame.
3. Timer row.
4. Primary action button.
5. Secondary actions for retake/retry after recording.
6. Upload/progress/error message.

### Teacher Edit Mode

Teacher controls should be minimal:

- Max duration input.
- Helper text explaining that students must record in browser and can retake before submitting.
- Manual grading badge or hint.

### Accessibility

- All controls must be keyboard accessible.
- Timer text must be readable by screen readers.
- Recording state changes must be announced.
- Buttons must not rely only on color.
- Camera permission errors must include text instructions.
- Video playback must expose native controls or equivalent accessible controls.

## Technical Design

### 1. Shared Question Type Package

Add `VIDEO_RECORDING` to `@cio/question-types`:

- `question-type-keys.ts`
- `question-type-registry.ts`
- `answer-data.ts`
- `answer-codecs.ts`
- `question-answer-payload.ts`
- `exercise-types.ts` label keys
- tests

Expected registry id:

- Use the next unused id after `LINK` (`13`) unless production data has already claimed it.

### 2. UI Renderer Package

Add renderers under:

```text
packages/ui/src/custom/exercise-question/renderers/video-recording/
  edit.svelte
  take.svelte
  preview.svelte
  submission.svelte
```

Register in:

- `packages/ui/src/custom/exercise-question/renderer-contract.ts`
- `packages/ui/src/custom/exercise-question/index.ts`

The `take.svelte` renderer owns recording UI state but should delegate upload to the injected file/video upload callback or a dashboard adapter. `@cio/ui` should not directly know API routes.

### 3. Dashboard Integration

Update:

- Question type picker metadata.
- Exercise labels and translations.
- Student exercise take flow.
- Submission review flow.
- Answer serialization usage if dashboard-specific adapters are needed.

All user-facing copy must live in dashboard translations.

### 4. API Upload Contract

Add recording-specific upload routes instead of reusing generic lesson video upload directly.

Proposed upload initialization endpoint:

```text
POST /course/:courseId/exercise/:exerciseId/question/:questionId/video-recording/upload/init
```

Response:

```json
{
  "success": true,
  "data": {
    "assetId": "asset_uuid",
    "uploadUrl": "https://...",
    "fileKey": "exercise-recordings/org-id/course-id/exercise-id/question-id/uuid.webm",
    "expiresAt": "2026-04-29T12:00:00.000Z"
  }
}
```

Proposed upload completion endpoint:

```text
POST /course/:courseId/exercise/:exerciseId/question/:questionId/video-recording/upload/complete
```

Request:

```json
{
  "assetId": "asset_uuid",
  "storageKey": "exercise-recordings/org-id/course-id/exercise-id/question-id/uuid.webm",
  "fileName": "recording.webm",
  "mimeType": "video/webm",
  "size": 1048576,
  "durationSeconds": 58,
  "recordedAt": "2026-04-29T11:59:00.000Z"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "type": "VIDEO_RECORDING",
    "assetId": "asset_uuid",
    "storageKey": "exercise-recordings/org-id/course-id/exercise-id/question-id/uuid.webm",
    "fileName": "recording.webm",
    "mimeType": "video/webm",
    "size": 1048576,
    "durationSeconds": 58,
    "recordedAt": "2026-04-29T11:59:00.000Z",
    "uploadedAt": "2026-04-29T12:00:00.000Z",
    "provider": "cloudflare"
  }
}
```

The upload routes must:

- Require `authMiddleware`.
- Validate the user can submit to the exercise.
- Validate the question belongs to the exercise.
- Validate the question type is `VIDEO_RECORDING`.
- Use the configured storage provider abstraction where possible.
- Generate Cloudflare-compatible upload URLs for the video bucket.
- Create a pending `assets` row during upload initialization.
- Finalize the asset only after the browser upload succeeds.
- Return durable answer data from completion without a playback URL.

### 4.1 Playback URL Contract

Playback URLs are generated on demand after access checks.

Proposed endpoint:

```text
GET /course/:courseId/exercise/:exerciseId/submission/:submissionId/question/:questionId/video-recording/playback
```

Response:

```json
{
  "success": true,
  "data": {
    "assetId": "asset_uuid",
    "playbackUrl": "https://...",
    "expiresAt": "2026-04-29T12:10:00.000Z"
  }
}
```

Rules:

- Students can request playback for their own active answer.
- Teachers can request playback for submissions they are allowed to review.
- Playback URLs must be short-lived.
- The API should resolve playback by `assetId` first and fall back to `storageKey` only if needed for migration or repair.

### 5. Storage

Recommended storage namespace:

```text
exercise-recordings/{organizationId}/{courseId}/{exerciseId}/{questionId}/{submissionOrProfileId}/{uuid}.{ext}
```

Storage metadata:

- organization id
- course id
- exercise id
- question id
- profile/group member id
- mime type
- byte size
- duration seconds
- created at

Media manager integration is required for v1:

- Create an `assets` row with `kind = 'video'`.
- Create the asset as `pending` during upload initialization.
- Mark the asset `active` only after upload completion succeeds.
- Create an `asset_usages` row with `target_type = 'submission_answer'` after the answer is accepted.
- Store `assetId` in the answer payload.

### 6. Submission Persistence

The answer codec serializes `VideoRecordingAnswerData` into the existing answer storage path.

Required payload fields:

- `type`
- `assetId`
- `storageKey`
- `mimeType`
- `size`
- `durationSeconds`
- `recordedAt`
- `uploadedAt`

### 7. Cleanup

Cleanup is part of the v1 implementation because retakes can otherwise create unbounded storage waste.

Asset states:

| State | Meaning | Cleanup behavior |
| --- | --- | --- |
| `pending` | Upload URL was issued, but upload completion has not succeeded | Delete after short expiry window |
| `active` | Asset is referenced by the latest accepted answer | Keep |
| `superseded` | Asset was replaced by a newer accepted take before submission | Delete after retention window |
| `abandoned` | Student recorded/uploaded but never submitted the exercise or removed the answer | Delete after retention window |
| `orphaned` | Asset is not referenced by any answer or usage | Delete after retention window |
| `deleted` | Object and asset metadata are deleted or tombstoned | Exclude from playback |

Rules:

- When a student accepts and uploads a new take, mark the previously accepted asset for that question and student as `superseded`.
- Do not delete superseded assets synchronously in the student request path.
- Scheduled cleanup deletes `pending` assets whose upload URL expired and no completion was received.
- Scheduled cleanup deletes `superseded`, `abandoned`, and `orphaned` assets after the configured retention window.
- Cleanup must verify the asset is not referenced by the latest answer payload before deleting the object.
- Cleanup must remove or tombstone the `asset_usages` row and then delete the storage object.
- Cleanup failures must be logged with `assetId`, `storageKey`, and reason.
- The cleanup job should be idempotent so retries are safe.

Suggested defaults:

- Pending upload expiry: 24 hours.
- Superseded/abandoned/orphaned retention: 7 days.

## Security and Privacy Requirements

1. Camera and microphone are only activated after explicit student action.
2. Browser permission errors are handled without crashing the exercise.
3. Upload URLs are short-lived.
4. Upload keys are scoped to the authenticated student and question.
5. Students cannot overwrite another student's recording.
6. Students cannot submit a recording answer for a question they cannot access.
7. Teacher playback must respect course/org access controls.
8. Playback URLs must be generated server-side for review.
9. The system must not expose raw storage credentials to the browser.
10. Retake metadata must not be shown to teachers unless product explicitly decides to expose it.

## Analytics and Observability

Track:

- Recording permission denied.
- Recording started.
- Recording stopped manually.
- Recording auto-stopped at max duration.
- Recording retaken.
- Recording accepted.
- Upload started.
- Upload succeeded.
- Upload failed.
- Cleanup queued.
- Cleanup succeeded.
- Cleanup failed.
- Submission with video recording answer completed.

Operational metrics:

- Upload failure rate.
- Average recording duration.
- Average upload time.
- Storage consumed by video recording answers.
- Orphaned recording count and bytes.
- Superseded recording count and bytes.
- Cleanup deleted bytes.

## Rollout Plan

### Phase A: Foundation

- Add question type registry entry.
- Add answer data and codec.
- Add seed/reference data.
- Add tests for serialization and registry.

### Phase B: Recording UI

- Add edit renderer with max duration setting.
- Add take renderer with camera preview, recording, timer, playback, retake, and upload states.
- Add preview/submission renderers.
- Add translations and picker metadata.

### Phase C: Upload and Persistence

- Add recording-specific upload initialization and completion routes.
- Create pending media assets during upload initialization.
- Store answer payload with `assetId`, `storageKey`, duration, and metadata.
- Ensure submission validation and manual grading behavior work.

### Phase D: Playback and Cleanup

- Add teacher playback in submission review.
- Add on-demand playback URL generation.
- Add cleanup job for pending, superseded, abandoned, and orphaned recording assets.

### Phase E: Hardening

- Add analytics and error logging.
- Add browser compatibility QA.

## Acceptance Criteria

1. A teacher can add a video recording question to an exercise.
2. A teacher can set max recording duration for the question.
3. A student can start recording from the browser without choosing a file.
4. The live recording frame is circular.
5. The recording timer is visible while recording.
6. Recording auto-stops at the configured max duration.
7. A student can stop early.
8. A student can replay the recording before accepting.
9. A student can retake the recording multiple times.
10. Only the latest accepted recording is saved as the answer.
11. The accepted recording uploads to Cloudflare-backed storage.
12. The answer payload stores `assetId`, `storageKey`, and metadata, not a persisted playback URL.
13. Required video recording questions block submission until upload succeeds.
14. Teachers can play the submitted recording during review through an on-demand playback URL.
15. Superseded, abandoned, and orphaned recording assets are cleaned up asynchronously.
16. Video recording questions require manual grading.
17. Unsupported browsers show a clear message and do not offer file upload fallback.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Browser MediaRecorder differences | Recording may fail on some devices | Compatibility testing and MIME fallback list |
| Large uploads on mobile networks | Student frustration and failed submissions | Short max duration, upload progress, retry |
| Storage cost growth from retakes | Higher Cloudflare costs | Store only the latest answer reference, mark replaced assets as superseded, and run scheduled cleanup |
| Playback URL expiry | Teacher cannot play older answers | Store `assetId` and `storageKey`, then generate playback URLs on demand |
| Permission denial | Student cannot answer | Clear permission guidance and teacher visibility into incomplete answers |
| Privacy expectations | Sensitive student video data mishandled | Strict access checks, short-lived URLs, retention policy |

## Dependencies

- Browser `MediaRecorder` and `getUserMedia` support.
- Cloudflare-compatible video object storage.
- Existing storage/presign utility or storage provider abstraction.
- Shared question renderer architecture.
- Existing manual grading flow.
- Dashboard translation infrastructure.

## Future Enhancements

- Teacher-configurable retake limit.
- One-take-only mode.
- Automatic thumbnail generation.
- Audio-only recording question type.
- Speech transcription.
- AI-assisted rubric feedback.
- Recording countdown before capture starts.
- Organization-level recording retention settings.
- Upload resume for unstable mobile networks.
- Media manager integration for all recording answers.
