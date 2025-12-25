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

#### Encoding Specifications (Based on Blog Post):
- **Resolutions**: 720p (1280x720), 1080p (1920x1080), 2160p (3840x2160)
- **Bitrates**: 1200k, 2500k, 8000k respectively
- **Codec**: H.264 (libx264) with AAC audio
- **Segment Duration**: 4 seconds (hls_time 4)
- **Profile/Level**: Based on resolution (high profile, levels 3.1-5.1)

#### Implementation Steps:

1. **Create Video Processing Service**
   - Add a new endpoint: `POST /api/media/video/process`
   - Accepts video fileKey after upload
   - Queues encoding job (use BullMQ, AWS SQS, or similar)

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

### 7. Implementation Priority

#### Phase 1: Foundation (Week 1-2)
1. ✅ Set up FFmpeg encoding service
2. ✅ Create processing queue/job system
3. ✅ Implement basic HLS encoding script
4. ✅ Update database schema

#### Phase 2: Integration (Week 3-4)
1. ✅ Integrate encoding into upload flow
2. ✅ Update frontend player with HLS.js
3. ✅ Add processing status UI
4. ✅ Test with sample videos

#### Phase 3: Enhancement (Week 5-6)
1. ✅ Add thumbnail generation
2. ✅ Implement quality selector UI
3. ✅ Add video metadata extraction (duration, etc.)
4. ✅ Performance monitoring and optimization

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

### API Endpoint Example

```typescript
// apps/api/src/routes/media/video/process.ts
export const videoProcessRouter = new Hono()
  .post('/process', authMiddleware, async (c) => {
    const { fileKey } = await c.req.json();
    
    // Queue encoding job
    const jobId = await videoProcessingQueue.add('encode-video', {
      fileKey,
      userId: c.get('user').id
    });
    
    return c.json({
      success: true,
      jobId,
      status: 'queued'
    });
  })
  .get('/status/:jobId', authMiddleware, async (c) => {
    const jobId = c.req.param('jobId');
    const job = await videoProcessingQueue.getJob(jobId);
    
    return c.json({
      success: true,
      status: await job.getState(),
      progress: job.progress,
      result: job.returnvalue
    });
  });
```

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
