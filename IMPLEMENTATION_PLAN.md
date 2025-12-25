# Video Infrastructure Implementation Plan

Complete implementation plan for HLS encoding, caption generation, and video processing improvements.

## Overview

**Goal**: Implement self-hosted video processing pipeline with HLS adaptive bitrate streaming and automatic caption generation.

**Timeline**: 6-8 weeks  
**Team Size**: 1-2 developers  
**Complexity**: Medium-High

## Prerequisites

- ✅ Docker and Docker Compose installed
- ✅ Redis available (or can be added)
- ✅ FFmpeg knowledge helpful but not required
- ✅ Node.js/TypeScript experience
- ✅ Basic understanding of video formats

## Phase Breakdown

```
Phase 1: Foundation (Week 1-2)
  ├── Infrastructure Setup
  ├── Queue System (BullMQ)
  └── Basic Encoding Pipeline

Phase 2: Core Features (Week 3-4)
  ├── HLS Encoding
  ├── Caption Generation (Whisper)
  └── Database Updates

Phase 3: Integration (Week 5-6)
  ├── API Endpoints
  ├── Frontend Player Updates
  └── Processing Status UI

Phase 4: Migration & Polish (Week 7-8)
  ├── Migrate Existing Videos
  ├── Remove Muse.ai
  ├── Testing & Optimization
  └── Documentation
```

---

## Phase 1: Foundation (Week 1-2)

### Week 1: Infrastructure Setup

#### Day 1-2: Docker & Redis Setup

**Tasks:**
- [ ] Add Redis service to `docker/docker-compose.yaml`
- [ ] Add Whisper API service to `docker/docker-compose.yaml`
- [ ] Update environment variables
- [ ] Test Redis connection
- [ ] Test Whisper API health endpoint

**Files to Create/Modify:**
- `docker/docker-compose.yaml` - Add Redis and Whisper services
- `.env.example` - Add new environment variables
- `apps/api/src/config/env.ts` - Add new env vars

**Acceptance Criteria:**
- ✅ Redis container running and accessible
- ✅ Whisper API responding to health checks
- ✅ Environment variables properly configured

**Commands:**
```bash
# Start services
docker-compose up -d redis whisper-api

# Test Redis
docker-compose exec redis redis-cli ping

# Test Whisper
curl http://localhost:9000/health
```

#### Day 3-4: BullMQ Queue Setup

**Tasks:**
- [ ] Install BullMQ dependencies
- [ ] Create queue service (`apps/api/src/services/video/queue.ts`)
- [ ] Create queue events handler
- [ ] Add queue initialization to main app
- [ ] Test queue creation and job addition

**Files to Create:**
- `apps/api/src/services/video/queue.ts`
- `apps/api/src/services/video/types.ts`

**Dependencies:**
```bash
cd apps/api
pnpm add bullmq
pnpm add -D @types/bullmq
```

**Acceptance Criteria:**
- ✅ Queue created successfully
- ✅ Can add jobs to queue
- ✅ Jobs visible in Redis
- ✅ Queue events firing

**Test:**
```typescript
// Test script
import { videoProcessingQueue } from './services/video/queue';

const job = await videoProcessingQueue.add('test-job', { test: true });
console.log('Job created:', job.id);
```

#### Day 5: FFmpeg Setup & Testing

**Tasks:**
- [ ] Verify FFmpeg in Docker container
- [ ] Create test encoding script
- [ ] Test basic video encoding
- [ ] Test audio extraction

**Files to Create:**
- `apps/api/src/services/video/encoder.ts` (basic structure)
- `apps/api/scripts/test-ffmpeg.ts`

**Acceptance Criteria:**
- ✅ FFmpeg available in container
- ✅ Can extract audio from video
- ✅ Can encode video to different formats

**Test Command:**
```bash
docker-compose exec api ffmpeg -version
docker-compose exec api ffmpeg -i test-video.mp4 -vn -acodec libmp3lame audio.mp3
```

### Week 2: Basic Worker & Pipeline

#### Day 1-2: Video Worker Setup

**Tasks:**
- [ ] Create worker service (`apps/api/src/services/video/worker.ts`)
- [ ] Implement basic job processing
- [ ] Add progress tracking
- [ ] Add error handling
- [ ] Test worker with sample video

**Files to Create:**
- `apps/api/src/services/video/worker.ts`
- `apps/api/src/services/video/utils.ts` (helper functions)

**Acceptance Criteria:**
- ✅ Worker processes jobs from queue
- ✅ Progress updates working
- ✅ Errors handled gracefully
- ✅ Worker logs properly

**Test:**
```typescript
// Add test job
await videoProcessingQueue.add('encode-video', {
  fileKey: 'test-video-key',
  userId: 'test-user',
});

// Monitor worker logs
// Check job status via API
```

#### Day 3-4: R2 Integration

**Tasks:**
- [ ] Create R2 download utility
- [ ] Create R2 upload utility for processed files
- [ ] Test file download/upload
- [ ] Add cleanup utilities

**Files to Create:**
- `apps/api/src/services/video/storage.ts`

**Files to Modify:**
- `apps/api/src/utils/s3.ts` - Add helper functions if needed

**Acceptance Criteria:**
- ✅ Can download videos from R2
- ✅ Can upload processed files to R2
- ✅ Proper error handling for missing files
- ✅ Cleanup works correctly

#### Day 5: Database Schema Updates

**Tasks:**
- [ ] Create migration for video processing fields
- [ ] Add caption fields
- [ ] Add HLS manifest URL field
- [ ] Add processing status field
- [ ] Test migration

**Files to Create:**
- `supabase/migrations/YYYYMMDDHHMMSS_video_processing.sql`

**Migration SQL:**
```sql
-- Add video processing fields
ALTER TABLE videos ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS hls_manifest_url TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS encoding_job_id VARCHAR(255);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS available_qualities JSONB;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Add caption fields
ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption_srt_url TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption_vtt_url TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption_transcript TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption_language VARCHAR(10);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption_status VARCHAR(20) DEFAULT 'pending';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_videos_processing_status ON videos(processing_status);
CREATE INDEX IF NOT EXISTS idx_videos_encoding_job_id ON videos(encoding_job_id);
```

**Acceptance Criteria:**
- ✅ Migration runs successfully
- ✅ All fields added correctly
- ✅ Indexes created
- ✅ Can query by processing status

**Phase 1 Deliverables:**
- ✅ Redis and Whisper running in Docker
- ✅ BullMQ queue system operational
- ✅ Basic worker processing jobs
- ✅ Database schema updated
- ✅ R2 integration working

---

## Phase 2: Core Features (Week 3-4)

### Week 3: HLS Encoding

#### Day 1-2: FFmpeg HLS Encoding Script

**Tasks:**
- [ ] Implement HLS encoding function
- [ ] Create master playlist generator
- [ ] Test encoding with multiple qualities
- [ ] Verify segment generation

**Files to Create:**
- `apps/api/src/services/video/encoder.ts` (full implementation)
- `apps/api/src/services/video/hls.ts` (playlist generation)

**Key Functions:**
```typescript
- encodeVideoToHLS(videoBuffer, fileKey, outputDir)
- generateMasterPlaylist(qualities)
- uploadHLSSegments(segments, fileKey)
```

**Acceptance Criteria:**
- ✅ Generates 720p, 1080p, 2160p variants
- ✅ Creates .m3u8 playlists
- ✅ Creates .ts segments
- ✅ Master playlist includes all qualities
- ✅ Segments properly named and organized

**Test:**
```bash
# Test encoding locally
node scripts/test-hls-encoding.js test-video.mp4

# Verify output
ls -la output/
# Should see: master.m3u8, 720p.m3u8, 1080p.m3u8, 2160p.m3u8
# And: 720p_000.ts, 720p_001.ts, etc.
```

#### Day 3: Integration with Worker

**Tasks:**
- [ ] Integrate HLS encoding into worker
- [ ] Add progress updates during encoding
- [ ] Handle encoding errors
- [ ] Upload segments to R2

**Files to Modify:**
- `apps/api/src/services/video/worker.ts`

**Acceptance Criteria:**
- ✅ Worker calls encoding function
- ✅ Progress updates during encoding (10%, 20%, etc.)
- ✅ Segments uploaded to R2
- ✅ Manifest URLs stored in database

#### Day 4-5: Testing & Optimization

**Tasks:**
- [ ] Test with various video formats
- [ ] Test with different resolutions
- [ ] Optimize encoding settings
- [ ] Measure encoding times
- [ ] Test error scenarios

**Acceptance Criteria:**
- ✅ Handles various input formats
- ✅ Encoding completes successfully
- ✅ Files uploaded correctly
- ✅ Database updated properly

### Week 4: Caption Generation

#### Day 1-2: Whisper Integration

**Tasks:**
- [ ] Create caption service (`apps/api/src/services/video/captions.ts`)
- [ ] Implement audio extraction
- [ ] Implement Whisper API client
- [ ] Test transcription with sample audio

**Files to Create:**
- `apps/api/src/services/video/captions.ts`

**Key Functions:**
```typescript
- extractAudio(videoPath, outputPath)
- generateCaptionsWithAPI(audioPath, options)
- convertToSRT(segments)
- convertToVTT(segments)
```

**Acceptance Criteria:**
- ✅ Can extract audio from video
- ✅ Whisper API returns transcription
- ✅ SRT and VTT formats generated correctly
- ✅ Proper error handling

**Test:**
```typescript
// Test caption generation
const captions = await generateCaptionsWithAPI('audio.mp3', {
  language: 'en',
  model: 'base',
});

console.log('Transcript:', captions.transcript);
console.log('SRT:', captions.srtContent);
```

#### Day 3: Worker Integration

**Tasks:**
- [ ] Add caption generation to worker
- [ ] Run in parallel with encoding (optional optimization)
- [ ] Upload captions to R2
- [ ] Update database with caption URLs

**Files to Modify:**
- `apps/api/src/services/video/worker.ts`

**Acceptance Criteria:**
- ✅ Captions generated during processing
- ✅ SRT and VTT files uploaded
- ✅ Database updated with caption URLs
- ✅ Processing completes successfully

#### Day 4-5: Testing & Edge Cases

**Tasks:**
- [ ] Test with different languages
- [ ] Test with long videos
- [ ] Test with poor audio quality
- [ ] Handle transcription failures gracefully
- [ ] Test multi-language support

**Acceptance Criteria:**
- ✅ Handles various audio qualities
- ✅ Supports multiple languages
- ✅ Graceful failure handling
- ✅ Proper retry logic

**Phase 2 Deliverables:**
- ✅ HLS encoding working
- ✅ Multiple quality variants generated
- ✅ Caption generation integrated
- ✅ Full processing pipeline operational

---

## Phase 3: Integration (Week 5-6)

### Week 5: API Endpoints

#### Day 1-2: Processing Endpoints

**Tasks:**
- [ ] Create video processing endpoint
- [ ] Create status check endpoint
- [ ] Add authentication middleware
- [ ] Add request validation
- [ ] Write API documentation

**Files to Create:**
- `apps/api/src/routes/media/video/process.ts`
- `apps/api/src/routes/media/video/status.ts`

**Endpoints:**
```
POST /api/media/video/process
  Body: { fileKey: string, language?: string }
  Response: { jobId: string, status: 'queued' }

GET /api/media/video/status/:jobId
  Response: { status: string, progress: number, result?: object }
```

**Acceptance Criteria:**
- ✅ Endpoints properly authenticated
- ✅ Request validation working
- ✅ Jobs queued successfully
- ✅ Status updates accurate
- ✅ Error responses proper

#### Day 3: Update Upload Flow

**Tasks:**
- [ ] Modify upload component to trigger processing
- [ ] Add processing status polling
- [ ] Update success handling
- [ ] Add error handling

**Files to Modify:**
- `apps/dashboard/src/lib/components/Course/components/Lesson/Materials/Video/UploadVideo.svelte`
- `apps/dashboard/src/lib/utils/services/courses/presign.ts`

**Acceptance Criteria:**
- ✅ Upload triggers processing automatically
- ✅ Status updates shown to user
- ✅ Success message when complete
- ✅ Errors displayed properly

#### Day 4-5: Testing API Integration

**Tasks:**
- [ ] Test end-to-end upload flow
- [ ] Test status polling
- [ ] Test error scenarios
- [ ] Test concurrent uploads
- [ ] Performance testing

**Acceptance Criteria:**
- ✅ Full flow works end-to-end
- ✅ Multiple uploads handled
- ✅ Status updates timely
- ✅ No memory leaks

### Week 6: Frontend Updates

#### Day 1-2: Video Player Component

**Tasks:**
- [ ] Install HLS.js library
- [ ] Update ComponentVideo.svelte
- [ ] Add HLS support
- [ ] Add caption track support
- [ ] Test with HLS streams

**Files to Modify:**
- `apps/dashboard/src/lib/components/Course/components/Lesson/Materials/components/ComponentVideo.svelte`

**Dependencies:**
```bash
cd apps/dashboard
pnpm add hls.js
pnpm add -D @types/hls.js
```

**Acceptance Criteria:**
- ✅ HLS streams play correctly
- ✅ Captions display properly
- ✅ Quality switching works
- ✅ Fallback for non-HLS videos
- ✅ Works in all browsers

#### Day 3: Processing Status UI

**Tasks:**
- [ ] Create processing status component
- [ ] Add progress indicator
- [ ] Show available qualities
- [ ] Add caption toggle
- [ ] Update lesson materials display

**Files to Create:**
- `apps/dashboard/src/lib/components/Course/components/Lesson/Materials/Video/ProcessingStatus.svelte`

**Files to Modify:**
- `apps/dashboard/src/lib/components/Course/components/Lesson/Materials/index.svelte`

**Acceptance Criteria:**
- ✅ Status shown during processing
- ✅ Progress bar accurate
- ✅ User can see when ready
- ✅ Quality selector works
- ✅ Caption toggle functional

#### Day 4-5: Student-Facing Player

**Tasks:**
- [ ] Update course-app video player
- [ ] Add HLS support
- [ ] Add caption support
- [ ] Test on student dashboard
- [ ] Mobile testing

**Files to Modify:**
- `apps/course-app/src/lib/components/VideoPlayer.svelte` (if exists)
- Or create new component

**Acceptance Criteria:**
- ✅ Students can play HLS videos
- ✅ Captions available
- ✅ Works on mobile
- ✅ Quality adapts to connection

**Phase 3 Deliverables:**
- ✅ API endpoints working
- ✅ Frontend integrated
- ✅ Processing status UI
- ✅ Student-facing player updated

---

## Phase 4: Migration & Polish (Week 7-8)

### Week 7: Migration

#### Day 1-2: Migration Script

**Tasks:**
- [ ] Create migration script
- [ ] Identify videos to migrate
- [ ] Queue videos for processing
- [ ] Add monitoring
- [ ] Test migration script

**Files to Create:**
- `apps/api/scripts/migrate-videos.ts`
- `apps/api/scripts/migrate-from-muse.ts`

**Acceptance Criteria:**
- ✅ Script identifies all videos
- ✅ Queues videos correctly
- ✅ Progress tracking works
- ✅ Can resume if interrupted

#### Day 3: Remove Muse.ai Code

**Tasks:**
- [ ] Remove Muse.ai iframe from ComponentVideo.svelte
- [ ] Remove Muse.ai API code (if any)
- [ ] Update database schema (remove Muse fields)
- [ ] Update documentation

**Files to Modify:**
- `apps/dashboard/src/lib/components/Course/components/Lesson/Materials/components/ComponentVideo.svelte`
- `apps/api/README.md`

**Acceptance Criteria:**
- ✅ No Muse.ai references in code
- ✅ All videos use new player
- ✅ Database cleaned up

#### Day 4-5: Run Migration

**Tasks:**
- [ ] Run migration for test videos
- [ ] Monitor processing
- [ ] Fix any issues
- [ ] Run full migration
- [ ] Verify results

**Acceptance Criteria:**
- ✅ All videos processed
- ✅ Captions generated
- ✅ HLS files created
- ✅ Database updated
- ✅ Videos play correctly

### Week 8: Testing & Optimization

#### Day 1-2: Comprehensive Testing

**Tasks:**
- [ ] Test all video formats
- [ ] Test various video lengths
- [ ] Test error scenarios
- [ ] Load testing
- [ ] Browser compatibility

**Test Cases:**
- [ ] Upload small video (< 100MB)
- [ ] Upload large video (> 500MB)
- [ ] Upload different formats (MP4, MOV, AVI)
- [ ] Test processing failure recovery
- [ ] Test concurrent uploads (5+)
- [ ] Test caption generation for different languages
- [ ] Test HLS playback on different devices

**Acceptance Criteria:**
- ✅ All test cases pass
- ✅ Performance acceptable
- ✅ No critical bugs
- ✅ Error handling robust

#### Day 3: Performance Optimization

**Tasks:**
- [ ] Optimize encoding settings
- [ ] Optimize worker concurrency
- [ ] Add caching where appropriate
- [ ] Optimize database queries
- [ ] Monitor resource usage

**Optimizations:**
- [ ] Tune FFmpeg encoding presets
- [ ] Adjust worker concurrency
- [ ] Add Redis caching for status
- [ ] Optimize R2 upload batching

**Acceptance Criteria:**
- ✅ Encoding times acceptable
- ✅ Resource usage reasonable
- ✅ No bottlenecks identified

#### Day 4: Monitoring & Logging

**Tasks:**
- [ ] Add comprehensive logging
- [ ] Set up error tracking
- [ ] Add metrics collection
- [ ] Create monitoring dashboard (optional)
- [ ] Set up alerts

**Files to Create:**
- `apps/api/src/services/video/monitoring.ts`

**Metrics to Track:**
- Processing job success rate
- Average processing time
- Encoding time by video length
- Caption generation time
- Error rates by type

**Acceptance Criteria:**
- ✅ All important events logged
- ✅ Errors tracked
- ✅ Metrics collected
- ✅ Alerts configured

#### Day 5: Documentation

**Tasks:**
- [ ] Update API documentation
- [ ] Create user guide
- [ ] Document configuration
- [ ] Create troubleshooting guide
- [ ] Update README files

**Files to Create/Update:**
- `docs/video-processing.md`
- `docs/caption-generation.md`
- `docs/troubleshooting.md`
- `apps/api/README.md`
- `docker/README.md`

**Acceptance Criteria:**
- ✅ All features documented
- ✅ Configuration explained
- ✅ Troubleshooting guide complete
- ✅ Examples provided

**Phase 4 Deliverables:**
- ✅ All videos migrated
- ✅ Muse.ai removed
- ✅ Comprehensive testing complete
- ✅ Performance optimized
- ✅ Documentation complete

---

## Risk Mitigation

### Technical Risks

**Risk**: FFmpeg encoding fails for certain video formats  
**Mitigation**: 
- Test with various formats early
- Add format validation before processing
- Provide clear error messages
- Fallback to original video if encoding fails

**Risk**: Whisper API unavailable or slow  
**Mitigation**:
- Add health checks
- Implement retry logic
- Queue captions separately if needed
- Fallback to cloud API option

**Risk**: High memory usage during encoding  
**Mitigation**:
- Limit concurrent workers
- Monitor memory usage
- Add memory limits to Docker
- Process videos in batches

**Risk**: R2 upload failures  
**Mitigation**:
- Implement retry logic
- Add exponential backoff
- Monitor upload success rates
- Queue failed uploads for retry

### Business Risks

**Risk**: Processing takes too long, users frustrated  
**Mitigation**:
- Show clear progress indicators
- Set expectations (e.g., "Processing may take 5-10 minutes")
- Allow users to continue working while processing
- Send notification when complete

**Risk**: Existing videos broken during migration  
**Mitigation**:
- Test migration on staging first
- Keep old system running during transition
- Rollback plan ready
- Gradual migration (batches)

---

## Success Metrics

### Performance Metrics
- ✅ Video processing completes in < 2x video duration
- ✅ Caption generation completes in < 1.5x video duration
- ✅ 99%+ processing success rate
- ✅ < 5% error rate

### User Experience Metrics
- ✅ Videos start playing in < 3 seconds
- ✅ No buffering on good connections
- ✅ Captions available for 100% of videos
- ✅ User satisfaction with video quality

### Cost Metrics
- ✅ $0 additional API costs (self-hosted)
- ✅ Storage costs within budget
- ✅ Bandwidth costs minimal (R2 free egress)

---

## Rollout Strategy

### Phase 1: Internal Testing (Week 1-2)
- Deploy to staging environment
- Test with internal videos
- Fix critical issues

### Phase 2: Beta Testing (Week 3-4)
- Enable for select users/courses
- Gather feedback
- Monitor performance

### Phase 3: Gradual Rollout (Week 5-6)
- Enable for 25% of new uploads
- Monitor closely
- Increase to 50%, then 100%

### Phase 4: Full Migration (Week 7-8)
- Migrate existing videos
- Remove old system
- Monitor for issues

---

## Dependencies

### External Dependencies
- Docker & Docker Compose
- Redis (can be added)
- FFmpeg (included in Docker)
- Whisper API (Docker container)

### Internal Dependencies
- Cloudflare R2 access
- Database access
- Authentication system
- File upload system

---

## Post-Launch Tasks

### Week 9+: Monitoring & Iteration
- [ ] Monitor error rates
- [ ] Gather user feedback
- [ ] Optimize based on usage patterns
- [ ] Add features based on requests
- [ ] Scale infrastructure if needed

### Future Enhancements
- [ ] Video thumbnails generation
- [ ] Video preview clips
- [ ] Advanced caption editing UI
- [ ] Multi-language caption support
- [ ] Video analytics
- [ ] Automatic quality optimization

---

## Quick Reference

### Key Files Created
```
apps/api/src/services/video/
  ├── queue.ts          # BullMQ queue setup
  ├── worker.ts         # Video processing worker
  ├── encoder.ts        # HLS encoding logic
  ├── captions.ts       # Whisper caption generation
  └── storage.ts        # R2 upload/download utilities

apps/api/src/routes/media/video/
  ├── process.ts        # Processing endpoint
  └── status.ts         # Status check endpoint

docker/
  └── docker-compose.yaml  # Redis + Whisper services

supabase/migrations/
  └── YYYYMMDDHHMMSS_video_processing.sql
```

### Key Commands
```bash
# Start services
docker-compose up -d redis whisper-api

# Check queue status
docker-compose exec redis redis-cli KEYS "bull:video-encoding:*"

# View worker logs
docker-compose logs -f api | grep "video-worker"

# Run migration
tsx apps/api/scripts/migrate-videos.ts
```

### Environment Variables
```bash
REDIS_URL=redis://redis:6379
WHISPER_API_URL=http://whisper-api:9000
CLOUDFLARE_VIDEO_BUCKET_DOMAIN=https://your-bucket.r2.dev
```

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1: Foundation | Week 1-2 | Infrastructure, Queue, Basic Pipeline |
| Phase 2: Core Features | Week 3-4 | HLS Encoding, Caption Generation |
| Phase 3: Integration | Week 5-6 | API Endpoints, Frontend Updates |
| Phase 4: Migration & Polish | Week 7-8 | Migration, Testing, Documentation |

**Total Timeline**: 6-8 weeks

---

## Getting Started

1. **Review this plan** - Understand the full scope
2. **Set up development environment** - Docker, dependencies
3. **Start with Phase 1** - Infrastructure setup
4. **Follow phases sequentially** - Each builds on previous
5. **Test thoroughly** - At each phase completion
6. **Document as you go** - Keep notes for future reference

Good luck! 🚀
