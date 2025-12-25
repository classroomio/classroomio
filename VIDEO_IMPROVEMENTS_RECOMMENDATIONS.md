# Video Upload, Processing, and Loading Improvements

Based on the [Screencasting.com article on cheap video hosting](https://screencasting.com/articles/cheap-video-hosting), here are my recommendations for improving your video infrastructure.

## Current State Analysis

### ✅ What You're Doing Well
- **Cloudflare R2 Storage**: You're already using Cloudflare R2 for storage, which provides free egress bandwidth - excellent choice!
- **Presigned URLs**: Using presigned URLs for secure uploads/downloads
- **Direct Upload**: Videos are uploaded directly to R2 via presigned URLs, avoiding server bottlenecks

### ❌ Areas for Improvement
- **No Adaptive Bitrate Streaming**: Videos are served as single MP4 files, causing buffering on slower connections
- **No Video Encoding Pipeline**: Videos are stored as-is without optimization or multiple quality variants
- **No HLS Support**: Missing HTTP Live Streaming (HLS) for better performance and compatibility
- **Large File Sizes**: Users must download entire video files, even if they only watch a portion
- **No Progressive Loading**: Videos can't start playing until significant data is downloaded

## Recommended Improvements

### 1. Implement HLS (HTTP Live Streaming) with Adaptive Bitrate

**Priority: HIGH** - This is the most impactful improvement

#### Benefits:
- **Adaptive Quality**: Automatically adjusts video quality based on viewer's connection speed
- **Faster Initial Load**: Videos start playing faster with smaller initial segments
- **Better Mobile Experience**: Optimized for mobile networks with variable speeds
- **Reduced Buffering**: Seamless quality switching prevents interruptions
- **CDN-Friendly**: HLS segments cache efficiently on Cloudflare's CDN

#### Implementation Approach:

**Option A: Server-Side Encoding (Recommended for Scale)**
- Create a video processing service/queue that encodes uploaded videos into HLS format
- Use FFmpeg to generate multiple quality variants (720p, 1080p, 2160p)
- Store HLS segments and manifest files (.m3u8) in R2

**Option B: Client-Side Encoding (For MVP/Testing)**
- Use WebCodecs API or MediaRecorder for basic encoding (limited quality)
- Better suited for smaller files or proof-of-concept

**Recommended: Option A** - More control, better quality, matches the blog post approach

### 2. Video Encoding Pipeline

#### Architecture:
```
Upload → R2 (temporary) → Processing Queue → FFmpeg Encoding → HLS Segments → R2 (final) → Cleanup
```

#### Queue System: BullMQ with Redis

**Recommended: BullMQ** - You already have Redis set up, making this the perfect choice.

**Why BullMQ?**
- ✅ **Already have Redis** - No additional infrastructure needed
- ✅ **Docker-friendly** - Redis is easy to containerize
- ✅ **Mature & Battle-tested** - Used by many video processing pipelines
- ✅ **Great tooling** - Bull Board for monitoring (optional UI)
- ✅ **Job priorities** - Can prioritize urgent videos
- ✅ **Retry logic** - Built-in retry with exponential backoff
- ✅ **Progress tracking** - Real-time progress updates
- ✅ **Concurrency control** - Limit concurrent encoding jobs

**Alternative: pg-boss** (if you want to avoid Redis)
- Uses your existing PostgreSQL/Supabase database
- No additional infrastructure
- Good for simpler use cases
- Slightly less feature-rich than BullMQ

#### Encoding Specifications (Based on Blog Post):
- **Resolutions**: 720p (1280x720), 1080p (1920x1080), 2160p (3840x2160)
- **Bitrates**: 1200k, 2500k, 8000k respectively
- **Codec**: H.264 (libx264) with AAC audio
- **Segment Duration**: 4 seconds (hls_time 4)
- **Profile/Level**: Based on resolution (high profile, levels 3.1-5.1)

#### Implementation Steps:

1. **Install BullMQ**
   ```bash
   pnpm add bullmq
   pnpm add -D @types/bullmq
   ```

2. **Add Redis to Docker Compose** (if not already running)
   ```yaml
   redis:
     image: redis:7-alpine
     ports:
       - "6379:6379"
     volumes:
       - redis_data:/data
     command: redis-server --appendonly yes
   
   volumes:
     redis_data:
   ```

3. **Create Video Processing Service**
   - Add a new endpoint: `POST /api/media/video/process`
   - Accepts video fileKey after upload
   - Queues encoding job with BullMQ

2. **FFmpeg Encoding Script**
   - Create encoding script similar to blog post example
   - Generate HLS manifest (.m3u8) and segments (.ts files)
   - Upload encoded files back to R2

3. **Update Upload Flow**
   ```typescript
   // After video upload completes:
   1. Upload original video to R2 (temporary location)
   2. Trigger processing job
   3. Return processing status to frontend
   4. Frontend polls for completion
   5. Once processed, move original to archive or delete
   ```

### 3. Frontend Video Player Updates

#### Replace Plyr with HLS.js-Compatible Player

**Current**: Using Plyr with basic `<video>` element
**Recommended**: Use Video.js with HLS.js or Plyr with HLS.js support

#### Implementation:
```svelte
<script>
  import Hls from 'hls.js';
  import Plyr from 'plyr';
  
  let videoElement: HTMLVideoElement;
  let hls: Hls;
  
  onMount(() => {
    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      });
      
      hls.loadSource(video.m3u8Url); // Your HLS manifest URL
      hls.attachMedia(videoElement);
      
      // Optional: Integrate with Plyr for better UI
      const player = new Plyr(videoElement, {
        quality: {
          default: 'auto',
          options: ['2160p', '1080p', '720p'],
          forced: true,
          onChange: (quality) => {
            // Handle quality change if needed
          }
        }
      });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoElement.src = video.m3u8Url;
    }
  });
  
  onDestroy(() => {
    hls?.destroy();
  });
</script>

<video bind:this={videoElement} controls playsinline></video>
```

### 4. Database Schema Updates

Add fields to track video processing status:

```sql
-- Add to your videos/media table
ALTER TABLE videos ADD COLUMN processing_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE videos ADD COLUMN hls_manifest_url TEXT;
ALTER TABLE videos ADD COLUMN encoding_job_id VARCHAR(255);
ALTER TABLE videos ADD COLUMN available_qualities JSONB; -- ['720p', '1080p', '2160p']
ALTER TABLE videos ADD COLUMN duration INTEGER; -- in seconds
ALTER TABLE videos ADD COLUMN thumbnail_url TEXT;
```

### 5. Processing Status UI

#### Upload Component Updates:
- Show processing status after upload
- Display progress indicator for encoding
- Allow users to use video once processing completes
- Show available quality options

#### Example Status Flow:
```
Uploading... → Processing... → Ready (with quality selector)
```

### 6. Cost Optimization

#### Current Costs (Estimated):
- Storage: ~$0.015/GB/month (R2)
- Egress: FREE (R2 advantage!)
- Encoding: $0 (if done locally/server-side)

#### Additional Optimizations:
- **Thumbnail Generation**: Generate video thumbnails during encoding
- **Video Preview**: Create short preview clips for course listings
- **Compression**: Optimize original uploads before encoding
- **Lifecycle Policies**: Archive old videos to cheaper storage tiers

### 7. Caption/Subtitle Generation

**Priority: HIGH** - Improves accessibility and user experience

#### Why Captions Matter:
- **Accessibility** - Required for hearing-impaired users
- **SEO** - Search engines can index video content
- **Engagement** - Users watch videos longer with captions
- **Language Learning** - Helps non-native speakers
- **Mobile Viewing** - Many users watch without sound

#### Implementation:
See detailed guide: **[CAPTION_GENERATION_GUIDE.md](./CAPTION_GENERATION_GUIDE.md)**

**Quick Summary:**
- **Recommended**: OpenAI Whisper (self-hosted in Docker)
- **Integration**: Add to video encoding pipeline
- **Formats**: Generate both SRT and VTT files
- **Storage**: Store captions in R2 alongside video files
- **Cost**: $0 (self-hosted) vs ~$0.90/hour (cloud APIs)

**Architecture:**
```
Video Upload → Extract Audio → Whisper Transcription → Generate SRT/VTT → Upload to R2 → Link to Video
```

### 8. Implementation Priority

#### Phase 1: Foundation (Week 1-2)
1. ✅ Set up FFmpeg encoding service
2. ✅ Create processing queue/job system (BullMQ)
3. ✅ Set up Whisper API service (Docker)
4. ✅ Implement basic HLS encoding script
5. ✅ Update database schema

#### Phase 2: Integration (Week 3-4)
1. ✅ Integrate encoding into upload flow
2. ✅ Add caption generation to worker
3. ✅ Update frontend player with HLS.js + captions
4. ✅ Add processing status UI
5. ✅ Test with sample videos

#### Phase 3: Enhancement (Week 5-6)
1. ✅ Add thumbnail generation
2. ✅ Implement quality selector UI
3. ✅ Add caption editor UI (for corrections)
4. ✅ Add video metadata extraction (duration, etc.)
5. ✅ Multi-language caption support
6. ✅ Performance monitoring and optimization

#### Phase 4: Polish (Week 7+)
1. ✅ Error handling and retry logic
2. ✅ Analytics and usage tracking
3. ✅ Documentation
4. ✅ Migration script for existing videos

## Technical Implementation Details

### FFmpeg Encoding Script Example

```bash
#!/bin/bash
# Based on blog post recommendations

INPUT_FILE="$1"
OUTPUT_DIR="$2"
VIDEO_ID="$3"

RESOLUTIONS=("1280x720" "1920x1080" "3840x2160")
BITRATES=("1200k" "2500k" "8000k")
OUTPUTS=("720p" "1080p" "2160p")
GOP_SIZE=48

for i in "${!RESOLUTIONS[@]}"; do
  RES="${RESOLUTIONS[$i]}"
  BITRATE="${BITRATES[$i]}"
  OUTPUT_NAME="${OUTPUTS[$i]}"
  PLAYLIST="${OUTPUT_NAME}.m3u8"
  
  if [ "$OUTPUT_NAME" == "2160p" ]; then
    PROFILE="high"
    LEVEL="5.1"
  elif [ "$OUTPUT_NAME" == "1080p" ]; then
    PROFILE="high"
    LEVEL="4.2"
  else
    PROFILE="main"
    LEVEL="3.1"
  fi
  
  ffmpeg -y -i "$INPUT_FILE" \
    -c:v libx264 -preset veryfast -profile:v "$PROFILE" -level:v "$LEVEL" \
    -b:v "$BITRATE" -s "$RES" \
    -c:a aac -b:a 128k -ac 2 \
    -g $GOP_SIZE -keyint_min $GOP_SIZE -sc_threshold 0 \
    -force_key_frames "expr:gte(t,n_forced*4)" \
    -hls_time 4 -hls_list_size 0 -hls_flags independent_segments \
    -hls_segment_filename "$OUTPUT_DIR/${OUTPUT_NAME}_%03d.ts" \
    "$OUTPUT_DIR/$PLAYLIST"
done

# Create master playlist
cat > "$OUTPUT_DIR/master.m3u8" << EOF
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1920x1080
1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=8000000,RESOLUTION=3840x2160
2160p.m3u8
EOF
```

### Implementation Code Examples

#### 1. BullMQ Queue Setup

```typescript
// apps/api/src/services/video/queue.ts
import { Queue, Worker, QueueEvents } from 'bullmq';
import { redis } from '@api/utils/redis/redis';

export interface VideoEncodingJob {
  fileKey: string;
  userId: string;
  lessonId?: string;
}

export const videoProcessingQueue = new Queue<VideoEncodingJob>('video-encoding', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 10s, 20s
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 jobs
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
    },
  },
});

// Queue events for monitoring
export const videoQueueEvents = new QueueEvents('video-encoding', {
  connection: redis,
});
```

#### 2. Worker Setup (runs encoding jobs)

```typescript
// apps/api/src/services/video/worker.ts
import { Worker } from 'bullmq';
import { redis } from '@api/utils/redis/redis';
import { encodeVideoToHLS } from './encoder';
import type { VideoEncodingJob } from './queue';

export const videoWorker = new Worker<VideoEncodingJob>(
  'video-encoding',
  async (job) => {
    const { fileKey, userId } = job.data;
    
    // Update progress
    await job.updateProgress(0);
    
    // Download video from R2
    await job.updateProgress(10);
    const videoBuffer = await downloadVideoFromR2(fileKey);
    
    // Encode to HLS
    await job.updateProgress(20);
    const hlsFiles = await encodeVideoToHLS(videoBuffer, fileKey);
    
    // Upload HLS segments to R2
    await job.updateProgress(80);
    const manifestUrl = await uploadHLSToR2(hlsFiles, fileKey);
    
    // Cleanup temporary files
    await job.updateProgress(95);
    await cleanupTempFiles(hlsFiles);
    
    // Update database
    await job.updateProgress(100);
    await updateVideoProcessingStatus(fileKey, {
      status: 'completed',
      hlsManifestUrl: manifestUrl,
    });
    
    return { manifestUrl, fileKey };
  },
  {
    connection: redis,
    concurrency: 2, // Process 2 videos concurrently (adjust based on CPU)
    limiter: {
      max: 5, // Max 5 jobs
      duration: 60000, // per minute
    },
  }
);

// Handle worker events
videoWorker.on('completed', (job) => {
  console.log(`Video encoding completed: ${job.id}`);
});

videoWorker.on('failed', (job, err) => {
  console.error(`Video encoding failed: ${job?.id}`, err);
});
```

#### 3. API Endpoints

```typescript
// apps/api/src/routes/media/video/process.ts
import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { videoProcessingQueue } from '@api/services/video/queue';

export const videoProcessRouter = new Hono()
  .post('/process', authMiddleware, async (c) => {
    const { fileKey } = await c.req.json();
    const user = c.get('user');
    
    // Add job to queue
    const job = await videoProcessingQueue.add(
      'encode-video',
      {
        fileKey,
        userId: user.id,
      },
      {
        priority: 1, // Higher priority = processed first
        jobId: `video-${fileKey}`, // Prevent duplicates
      }
    );
    
    return c.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      message: 'Video processing started',
    });
  })
  .get('/status/:jobId', authMiddleware, async (c) => {
    const jobId = c.req.param('jobId');
    const job = await videoProcessingQueue.getJob(jobId);
    
    if (!job) {
      return c.json({ success: false, error: 'Job not found' }, 404);
    }
    
    const state = await job.getState();
    const progress = job.progress || 0;
    
    return c.json({
      success: true,
      jobId: job.id,
      status: state,
      progress: typeof progress === 'number' ? progress : 0,
      result: job.returnvalue,
      failedReason: job.failedReason,
    });
  });
```

#### 4. Start Worker in Main Process

```typescript
// apps/api/src/index.ts (or wherever you start your server)
import { videoWorker } from '@api/services/video/worker';

// Worker will start automatically when imported
// Make sure to gracefully shutdown:
process.on('SIGTERM', async () => {
  await videoWorker.close();
  process.exit(0);
});
```

#### 5. Optional: Bull Board UI (for monitoring)

```typescript
// apps/api/src/routes/admin/queue.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { videoProcessingQueue } from '@api/services/video/queue';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(videoProcessingQueue)],
  serverAdapter,
});

// Mount at /admin/queues in your Hono app
```

**Install Bull Board:**
```bash
pnpm add @bull-board/api @bull-board/express @bull-board/hono
```

#### 6. Docker Compose Update

Add Redis service to your `docker/docker-compose.yaml`:

```yaml
services:
  # ... existing services ...
  
  redis:
    image: redis:7-alpine
    container_name: classroomio-redis
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  redis_data:
    driver: local
```

Update your `.env` file:
```bash
REDIS_URL=redis://redis:6379  # For Docker
# OR
REDIS_URL=redis://localhost:6379  # For local dev
```

#### 7. FFmpeg in Docker

Add FFmpeg to your API Dockerfile:

```dockerfile
# In apps/api/Dockerfile or docker/Dockerfile.api
FROM node:20.19.3-slim AS app

# Install FFmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# ... rest of your Dockerfile
```

### Alternative: pg-boss (PostgreSQL-based Queue)

If you prefer to avoid Redis dependency, you can use **pg-boss** which uses your existing PostgreSQL/Supabase database:

**Pros:**
- ✅ No additional infrastructure (uses existing PostgreSQL)
- ✅ Simpler setup
- ✅ Good for smaller workloads

**Cons:**
- ❌ Less feature-rich than BullMQ
- ❌ Can add load to your database
- ❌ Not ideal for high-volume video processing

**Setup:**
```bash
pnpm add pg-boss
```

```typescript
import PgBoss from 'pg-boss';

const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL, // Your Supabase connection
});

await boss.start();

// Add job
const jobId = await boss.send('video-encoding', {
  fileKey: '...',
  userId: '...',
});

// Worker
await boss.work('video-encoding', async (job) => {
  // Process video
  return { success: true };
});
```

**Recommendation:** Stick with **BullMQ** since you already have Redis set up. It's more robust for video processing workloads.

## Expected Benefits

### Performance
- **50-70% faster initial load** (first frame appears sooner)
- **80-90% reduction in buffering** on slower connections
- **Better mobile experience** with adaptive quality

### Cost
- **No additional egress costs** (R2 free egress)
- **Minimal storage increase** (~20-30% for HLS segments vs single file)
- **Better CDN caching** reduces origin requests

### User Experience
- **Smoother playback** across all connection speeds
- **Professional quality** matching industry standards
- **Better engagement** with faster load times

## Migration Strategy for Existing Videos

1. **Backfill Process**: Create background job to re-encode existing videos
2. **Gradual Migration**: Process videos on-demand when accessed
3. **Dual Support**: Support both MP4 and HLS during transition period

## Monitoring & Analytics

Track these metrics:
- Encoding job success/failure rates
- Average encoding time per video
- Video playback start time (time-to-first-frame)
- Quality selection distribution
- Buffering events per session

## Conclusion

Implementing HLS with adaptive bitrate streaming will significantly improve your video delivery, matching industry best practices while leveraging Cloudflare R2's free egress bandwidth. The investment in encoding infrastructure will pay off through better user experience and reduced support issues related to video playback.

The blog post demonstrates this approach can handle 15TB+ monthly bandwidth for just $2.18/month in storage costs - a massive cost savings compared to traditional video hosting services.
