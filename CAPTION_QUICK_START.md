# Caption Generation - Quick Start

## TL;DR

**Use OpenAI Whisper** - Self-hosted, free, highly accurate.

## Setup (5 minutes)

### 1. Add Whisper to Docker Compose

```yaml
# docker/docker-compose.yaml
services:
  whisper-api:
    image: onerahmet/openai-whisper-asr-webservice:latest-cpu
    ports:
      - "9000:9000"
    environment:
      - ASR_MODEL=base
    volumes:
      - whisper_models:/root/.cache/whisper

volumes:
  whisper_models:
```

### 2. Add to Video Worker

```typescript
// In your video encoding worker
import { generateCaptionsWithAPI, extractAudio } from './captions';

// After extracting audio:
const audioPath = join(tempDir, 'audio.mp3');
await extractAudio(videoPath, audioPath);

// Generate captions
const captions = await generateCaptionsWithAPI(audioPath, {
  language: 'en',
  model: 'base',
});

// Upload captions to R2
await uploadToS3({
  Bucket: BUCKET_NAME.VIDEOS,
  Key: `captions/${fileKey}.vtt`,
  Body: captions.vttContent,
  ContentType: 'text/vtt',
});
```

### 3. Add to Video Player

```svelte
<video controls>
  <source src={video.hlsManifestUrl} />
  <track 
    kind="captions" 
    src={video.captions.vttUrl} 
    srclang="en" 
    label="English"
    default 
  />
</video>
```

## Options Comparison

| Solution | Cost | Accuracy | Speed | Self-Hosted |
|----------|------|----------|-------|-------------|
| **Whisper** ⭐ | $0 | ⭐⭐⭐⭐⭐ | Medium | ✅ |
| AssemblyAI | $0.90/hr | ⭐⭐⭐⭐ | Fast | ❌ |
| Google STT | $1.44/hr | ⭐⭐⭐⭐⭐ | Fast | ❌ |
| Vosk | $0 | ⭐⭐⭐ | Fast | ✅ |

## Full Implementation

See **[CAPTION_GENERATION_GUIDE.md](./CAPTION_GENERATION_GUIDE.md)** for complete details.
