# Flow 09 — Media manager & course import

- **Personas:** Admin/Tutor
- **Features covered (FEATURE_AUDIT §2):** 21 Course import · 22 Media manager · 36 Background jobs · 41 SCORM (⚠️ verify NOT shipped)
- **Modes:** both (storage = MinIO/S3; requires object storage configured)
- **Map refs:** FEATURE_AUDIT §3.16, §3.17, §7.2, Appendix

## Preconditions
- Object storage configured (MinIO locally, or S3). Jobs worker running (`pnpm api:dev` runs jobs).
- A sample video + a sample PDF to upload.

## Happy path — media
- [ ] **Upload a video.** Media → upload → presigned upload succeeds; asset created. _Ref:_ `routes/media/media.ts`, `routes/course/presign.ts`, `asset` `schema.ts:1028`.
- [ ] **Transcode to HLS.** Background job transcodes → HLS playable. _Ref:_ `apps/jobs`, `mediaJob`/`jobStep` `schema.ts:3297,3357`, `routes/hls.ts`.
- [ ] **Transcript generated.** Transcribe job produces a transcript. _Ref:_ `routes/transcripts.ts`, `mediaTranscript` `schema.ts:3393`.
- [ ] **Use asset in a lesson.** Insert uploaded media into a lesson → plays. _Ref:_ `assetUsage` `schema.ts:1086`.
- [ ] **Upload a document.** Upload PDF/doc → managed in media library.

## Happy path — course import
- [ ] **Import from prompt.** Org → Import course → prompt source → draft created. _Ref:_ `routes/organization/course-import.ts`, `courseImportDraft` `schema.ts:2603`, source enum `schema.ts:29`.
- [ ] **Import from PDF.** PDF source → parsed → draft. _Ref:_ `services/course-import`.
- [ ] **Review & publish draft.** Draft `DRAFT → PUBLISHED` → real course appears. _Ref:_ status enum `schema.ts:30`.

## Background jobs
- [ ] **Queue dashboard (dev).** `/admin/queues` shows queues/jobs in dev. _Ref:_ `routes/admin/queues.ts`, `app.ts:232-234`.
- [ ] **Retry / dead-letter.** A failing job retries and lands in dead-letter. _Ref:_ `deadLetterJob` `schema.ts:3447`.

## Edge cases / probes
- [ ] **Large file / unsupported format** → graceful error.
- [ ] **Job failure surfaces** to the user (not silent).
- [ ] **⚠️ SCORM NOT shipped:** confirm no SCORM upload/import is exposed. Record result. _Ref:_ audit §7.2.

**Coverage:** features 21, 22, 36, 41(verify-absent).
