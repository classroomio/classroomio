# Caption Generation Implementation Guide

Comprehensive guide for implementing automatic caption/subtitle generation for your video processing pipeline.

## Overview

Generate captions/subtitles automatically during video processing, supporting multiple languages and formats (SRT, VTT, WebVTT).

**Note:** This guide replaces any existing Muse.ai integration with a self-hosted Whisper solution that is more cost-effective and easier to self-host.

## Recommended Solutions

### Option 1: OpenAI Whisper (Self-Hosted) ⭐ **RECOMMENDED**

**Why Whisper?**
- ✅ **Self-hostable** - Run in Docker, no API costs
- ✅ **Highly accurate** - State-of-the-art accuracy
- ✅ **Multi-language** - Supports 99+ languages
- ✅ **Open source** - Free to use
- ✅ **Multiple models** - From fast (tiny) to accurate (large)
- ✅ **Works offline** - No external API dependencies

**Cons:**
- ❌ CPU/GPU intensive (but manageable with Docker)
- ❌ Slower than cloud APIs (but acceptable for async processing)

**Best for:** Self-hosted setups, cost-conscious, high accuracy needs

### Option 2: AssemblyAI (Cloud API)

**Why AssemblyAI?**
- ✅ **Fast** - Quick API responses
- ✅ **Accurate** - Good accuracy
- ✅ **Speaker diarization** - Identifies different speakers
- ✅ **Easy integration** - Simple REST API
- ✅ **Auto-punctuation** - Better formatting

**Cons:**
- ❌ **Cost** - ~$0.00025 per second (~$0.90 per hour)
- ❌ **External dependency** - Requires internet

**Best for:** Fast processing, when cost is acceptable

### Option 3: Google Speech-to-Text (Cloud API)

**Why Google?**
- ✅ **Very accurate** - Excellent for multiple languages
- ✅ **Enterprise-grade** - Reliable and scalable
- ✅ **Speaker labels** - Can identify speakers

**Cons:**
- ❌ **Expensive** - ~$0.006 per 15 seconds (~$1.44 per hour)
- ❌ **Complex setup** - Requires Google Cloud account

**Best for:** Enterprise needs, high accuracy requirements

### Option 4: Vosk (Lightweight Self-Hosted)

**Why Vosk?**
- ✅ **Very lightweight** - Small model sizes
- ✅ **Fast** - Quick processing
- ✅ **Self-hostable** - No API costs
- ✅ **Multiple languages** - Good language support

**Cons:**
- ❌ **Less accurate** - Not as good as Whisper
- ❌ **Smaller vocabulary** - May struggle with technical terms

**Best for:** Resource-constrained environments, simple use cases

## Recommendation: OpenAI Whisper

Given your self-hosting requirements and cost-conscious approach (matching your R2 strategy), **Whisper is the best choice**.

## Implementation Architecture

```
Video Upload → Encoding Queue → [FFmpeg Encoding + Whisper Transcription] → HLS + Captions → R2
```

### Integration with Existing Pipeline

Add caption generation as part of your video encoding job:

```
1. Upload video to R2
2. Queue encoding job
3. Worker processes:
   a. Download video from R2
   b. Extract audio track
   c. Run Whisper transcription
   d. Generate SRT/VTT files
   e. Encode video to HLS
   f. Upload HLS + captions to R2
   g. Update database with caption URLs
```

## Implementation Steps

### 1. Docker Setup for Whisper

#### Option A: Whisper API Server (Recommended)

Create a separate Whisper service that runs as an API:

**docker/docker-compose.yaml:**
```yaml
services:
  # ... existing services ...
  
  whisper-api:
    image: onerahmet/openai-whisper-asr-webservice:latest-gpu
    # OR for CPU-only:
    # image: onerahmet/openai-whisper-asr-webservice:latest-cpu
    container_name: classroomio-whisper
    ports:
      - "9000:9000"
    environment:
      - ASR_MODEL=base  # Options: tiny, base, small, medium, large
      - ASR_ENGINE=openai_whisper
    volumes:
      - whisper_models:/root/.cache/whisper
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  whisper_models:
    driver: local
```

**Model Size Guide:**
- `tiny` - Fastest, least accurate (~39M params)
- `base` - Good balance (~74M params) ⭐ **Recommended**
- `small` - Better accuracy (~244M params)
- `medium` - High accuracy (~769M params)
- `large` - Best accuracy, slowest (~1550M params)

#### Option B: Direct Whisper in API Container

Add Whisper to your API Dockerfile:

```dockerfile
# In apps/api/Dockerfile
FROM node:20.19.3-slim AS app

# Install FFmpeg and Python (for Whisper)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Whisper
RUN pip3 install openai-whisper

# ... rest of Dockerfile
```

### 2. Install Whisper Client Library

```bash
cd apps/api
pnpm add axios  # Already installed, but needed for API calls
# OR if using Python directly:
# pip3 install openai-whisper
```

### 3. Create Caption Service

**apps/api/src/services/video/captions.ts:**

```typescript
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink } from 'fs/promises';
import path from 'path';
import { env } from '@api/config/env';

const execAsync = promisify(exec);

export interface CaptionOptions {
  language?: string; // 'en', 'es', 'fr', etc. Auto-detect if not provided
  model?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  format?: 'srt' | 'vtt' | 'json';
}

export interface CaptionResult {
  srtUrl: string;
  vttUrl: string;
  transcript: string;
  language: string;
  duration: number;
}

/**
 * Generate captions using Whisper API service
 */
export async function generateCaptionsWithAPI(
  audioFilePath: string,
  options: CaptionOptions = {}
): Promise<CaptionResult> {
  const whisperApiUrl = env.WHISPER_API_URL || 'http://whisper-api:9000';
  
  const formData = new FormData();
  const audioBlob = await readFile(audioFilePath);
  formData.append('audio_file', new Blob([audioBlob]), 'audio.mp3');
  formData.append('task', 'transcribe');
  formData.append('language', options.language || '');
  formData.append('output', 'json');

  const response = await axios.post(`${whisperApiUrl}/asr`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 minutes
  });

  const result = response.data;
  
  // Convert to SRT and VTT formats
  const srtContent = convertToSRT(result.segments);
  const vttContent = convertToVTT(result.segments);

  return {
    transcript: result.text,
    language: result.language,
    duration: result.duration,
    srtUrl: '', // Will be uploaded to R2
    vttUrl: '', // Will be uploaded to R2
  };
}

/**
 * Generate captions using Whisper CLI (direct)
 */
export async function generateCaptionsWithCLI(
  audioFilePath: string,
  outputDir: string,
  options: CaptionOptions = {}
): Promise<CaptionResult> {
  const model = options.model || 'base';
  const language = options.language ? `--language ${options.language}` : '';
  
  // Run Whisper
  const { stdout } = await execAsync(
    `whisper "${audioFilePath}" --model ${model} ${language} --output_dir "${outputDir}" --output_format srt,vtt,json`
  );

  // Read generated files
  const baseName = path.basename(audioFilePath, path.extname(audioFilePath));
  const srtPath = path.join(outputDir, `${baseName}.srt`);
  const vttPath = path.join(outputDir, `${baseName}.vtt`);
  const jsonPath = path.join(outputDir, `${baseName}.json`);

  const [srtContent, vttContent, jsonContent] = await Promise.all([
    readFile(srtPath, 'utf-8'),
    readFile(vttPath, 'utf-8'),
    readFile(jsonPath, 'utf-8'),
  ]);

  const transcriptData = JSON.parse(jsonContent);

  return {
    transcript: transcriptData.text,
    language: transcriptData.language,
    duration: transcriptData.duration,
    srtContent,
    vttContent,
  };
}

/**
 * Extract audio from video file
 */
export async function extractAudio(
  videoPath: string,
  outputPath: string
): Promise<void> {
  await execAsync(
    `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ar 16000 -ac 1 "${outputPath}" -y`
  );
}

/**
 * Convert Whisper segments to SRT format
 */
function convertToSRT(segments: Array<{ start: number; end: number; text: string }>): string {
  return segments
    .map((segment, index) => {
      const start = formatSRTTime(segment.start);
      const end = formatSRTTime(segment.end);
      return `${index + 1}\n${start} --> ${end}\n${segment.text.trim()}\n`;
    })
    .join('\n');
}

/**
 * Convert Whisper segments to VTT format
 */
function convertToVTT(segments: Array<{ start: number; end: number; text: string }>): string {
  const header = 'WEBVTT\n\n';
  const body = segments
    .map((segment) => {
      const start = formatVTTTime(segment.start);
      const end = formatVTTTime(segment.end);
      return `${start} --> ${end}\n${segment.text.trim()}\n`;
    })
    .join('\n\n');
  return header + body;
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}
```

### 4. Integrate with Video Worker

**apps/api/src/services/video/worker.ts:**

```typescript
import { Worker } from 'bullmq';
import { redis } from '@api/utils/redis/redis';
import { encodeVideoToHLS } from './encoder';
import { generateCaptionsWithAPI, extractAudio } from './captions';
import { uploadToS3, deleteFromS3 } from '@api/utils/s3';
import { BUCKET_NAME } from '@api/constants/upload';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, mkdir, rm } from 'fs/promises';
import type { VideoEncodingJob } from './queue';

export const videoWorker = new Worker<VideoEncodingJob>(
  'video-encoding',
  async (job) => {
    const { fileKey, userId, language } = job.data;
    const tempDir = join(tmpdir(), `video-${job.id}`);
    
    try {
      await mkdir(tempDir, { recursive: true });
      
      // Download video from R2
      await job.updateProgress(5);
      const videoBuffer = await downloadVideoFromR2(fileKey);
      const videoPath = join(tempDir, 'input.mp4');
      await writeFile(videoPath, videoBuffer);
      
      // Extract audio for transcription
      await job.updateProgress(10);
      const audioPath = join(tempDir, 'audio.mp3');
      await extractAudio(videoPath, audioPath);
      
      // Generate captions (parallel with encoding for efficiency)
      await job.updateProgress(15);
      const captionPromise = generateCaptionsWithAPI(audioPath, {
        language: language || 'en',
        model: 'base',
      });
      
      // Encode video to HLS
      await job.updateProgress(20);
      const hlsFiles = await encodeVideoToHLS(videoBuffer, fileKey, tempDir);
      
      // Wait for captions
      await job.updateProgress(80);
      const captions = await captionPromise;
      
      // Upload HLS segments
      await job.updateProgress(85);
      const manifestUrl = await uploadHLSToR2(hlsFiles, fileKey);
      
      // Upload captions
      await job.updateProgress(90);
      const srtKey = `captions/${fileKey}.srt`;
      const vttKey = `captions/${fileKey}.vtt`;
      
      await uploadToS3({
        Bucket: BUCKET_NAME.VIDEOS,
        Key: srtKey,
        Body: captions.srtContent,
        ContentType: 'text/srt',
      });
      
      await uploadToS3({
        Bucket: BUCKET_NAME.VIDEOS,
        Key: vttKey,
        Body: captions.vttContent,
        ContentType: 'text/vtt',
      });
      
      const srtUrl = `${env.CLOUDFLARE_VIDEO_BUCKET_DOMAIN}/${srtKey}`;
      const vttUrl = `${env.CLOUDFLARE_VIDEO_BUCKET_DOMAIN}/${vttKey}`;
      
      // Update database
      await job.updateProgress(95);
      await updateVideoProcessingStatus(fileKey, {
        status: 'completed',
        hlsManifestUrl: manifestUrl,
        captions: {
          srtUrl,
          vttUrl,
          transcript: captions.transcript,
          language: captions.language,
        },
      });
      
      await job.updateProgress(100);
      
      return {
        manifestUrl,
        captions: { srtUrl, vttUrl },
      };
    } finally {
      // Cleanup temp files
      await rm(tempDir, { recursive: true, force: true });
    }
  },
  {
    connection: redis,
    concurrency: 1, // Lower concurrency for caption generation
  }
);
```

### 5. Update Database Schema

```sql
-- Add caption fields to videos table
ALTER TABLE videos ADD COLUMN caption_srt_url TEXT;
ALTER TABLE videos ADD COLUMN caption_vtt_url TEXT;
ALTER TABLE videos ADD COLUMN caption_transcript TEXT;
ALTER TABLE videos ADD COLUMN caption_language VARCHAR(10);
ALTER TABLE videos ADD COLUMN caption_status VARCHAR(20) DEFAULT 'pending';
```

### 6. Frontend Integration

**Update video player to support captions:**

```svelte
<!-- apps/dashboard/src/lib/components/Course/components/Lesson/Materials/components/ComponentVideo.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import Hls from 'hls.js';
  
  let videoElement: HTMLVideoElement;
  let hls: Hls;
  
  export let video: {
    link: string;
    hlsManifestUrl?: string;
    captions?: {
      srtUrl?: string;
      vttUrl?: string;
    };
  };
  
  onMount(() => {
    if (video.hlsManifestUrl && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(video.hlsManifestUrl);
      hls.attachMedia(videoElement);
      
      // Add captions if available
      if (video.captions?.vttUrl) {
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const track = document.createElement('track');
          track.kind = 'captions';
          track.label = 'English';
          track.srclang = 'en';
          track.src = video.captions.vttUrl;
          track.default = true;
          videoElement.appendChild(track);
        });
      }
    } else if (video.link) {
      videoElement.src = video.link;
      
      // Add captions for regular video
      if (video.captions?.vttUrl) {
        const track = document.createElement('track');
        track.kind = 'captions';
        track.label = 'English';
        track.srclang = 'en';
        track.src = video.captions.vttUrl;
        track.default = true;
        videoElement.appendChild(track);
      }
    }
  });
  
  onDestroy(() => {
    hls?.destroy();
  });
</script>

<video
  bind:this={videoElement}
  class="plyr-video-trigger iframe h-full w-full"
  playsinline
  controls
  style="aspect-ratio: 16/9;"
>
  <source src={video.link} type="video/mp4" />
</video>
```

### 7. Environment Variables

Add to `apps/api/src/config/env.ts`:

```typescript
const envSchema = z.object({
  // ... existing fields ...
  WHISPER_API_URL: z.string().optional().default('http://whisper-api:9000'),
  CLOUDFLARE_VIDEO_BUCKET_DOMAIN: z.string().optional(),
});
```

## Alternative: Cloud API Implementation

If you prefer cloud APIs, here's AssemblyAI integration:

```typescript
// apps/api/src/services/video/captions-assemblyai.ts
import axios from 'axios';

export async function generateCaptionsWithAssemblyAI(
  audioUrl: string,
  apiKey: string
): Promise<CaptionResult> {
  // Upload audio
  const uploadResponse = await axios.post(
    'https://api.assemblyai.com/v2/upload',
    { url: audioUrl },
    { headers: { authorization: apiKey } }
  );
  
  // Start transcription
  const transcriptResponse = await axios.post(
    'https://api.assemblyai.com/v2/transcript',
    { audio_url: uploadResponse.data.upload_url },
    { headers: { authorization: apiKey } }
  );
  
  const transcriptId = transcriptResponse.data.id;
  
  // Poll for completion
  let transcript;
  while (true) {
    const statusResponse = await axios.get(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      { headers: { authorization: apiKey } }
    );
    
    transcript = statusResponse.data;
    
    if (transcript.status === 'completed') break;
    if (transcript.status === 'error') throw new Error('Transcription failed');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Get SRT
  const srtResponse = await axios.get(
    `https://api.assemblyai.com/v2/transcript/${transcriptId}/srt`,
    { headers: { authorization: apiKey } }
  );
  
  // Convert to VTT
  const vttContent = convertSRTtoVTT(srtResponse.data);
  
  return {
    transcript: transcript.text,
    language: transcript.language_code,
    duration: transcript.audio_duration / 1000,
    srtContent: srtResponse.data,
    vttContent,
  };
}
```

## Cost Comparison

### Self-Hosted Whisper
- **Setup**: One-time Docker container
- **Running**: Server CPU/GPU resources
- **Cost**: $0 (just infrastructure)
- **Processing Time**: ~1-2x video duration (base model)

### AssemblyAI
- **Cost**: ~$0.90 per hour of video
- **Processing Time**: ~30-60 seconds per hour
- **Monthly (100 hours)**: ~$90

### Google Speech-to-Text
- **Cost**: ~$1.44 per hour of video
- **Processing Time**: ~30-60 seconds per hour
- **Monthly (100 hours)**: ~$144

## Recommendations

1. **Start with Whisper API service** (Docker container)
2. **Use `base` model** for good balance of speed/accuracy
3. **Process captions in parallel** with video encoding
4. **Store both SRT and VTT** formats for compatibility
5. **Add language detection** for multi-language courses
6. **Consider caching** transcriptions for re-uploads

## Next Steps

1. Set up Whisper API Docker container
2. Implement caption service
3. Integrate with video worker
4. Update database schema
5. Test with sample videos
6. Update frontend player
