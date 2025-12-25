# Migration from Muse.ai to Self-Hosted Whisper

## Why Migrate?

- ✅ **Cost**: Muse.ai is expensive and charges per video
- ✅ **Self-Hosting**: Muse.ai is harder to self-host
- ✅ **Complexity**: Simpler integration with our own pipeline
- ✅ **Control**: Full control over transcription quality and processing

## Current Muse.ai Integration

### Where It's Used

1. **ComponentVideo.svelte** - Has conditional for Muse.ai embeds:
   ```svelte
   {:else if video.metadata?.svid}
     <iframe src="https://muse.ai/embed/{video.metadata?.svid}?..." />
   ```

2. **Database** - Videos may have `metadata.svid` field storing Muse.ai video IDs

## Migration Steps

### Step 1: Remove Muse.ai Embed Code

**File**: `apps/dashboard/src/lib/components/Course/components/Lesson/Materials/components/ComponentVideo.svelte`

**Before:**
```svelte
{:else if video.metadata?.svid}
  <div style="position:relative;padding-bottom:51.416579%">
    <iframe
      src="https://muse.ai/embed/{video.metadata?.svid}?logo=https://app.classroomio.com/logo-512.png&subtitles=auto&cover_play_position=center"
      style="width:100%;height:100%;position:absolute;left:0;top:0"
      frameborder="0"
      allowfullscreen
      title="Muse AI Video Embed"
    ></iframe>
  </div>
{:else}
```

**After:**
```svelte
{:else}
  <!-- All videos now use native player with HLS + captions -->
  <video
    bind:this={videoElements[index]}
    class="plyr-video-trigger iframe h-full w-full"
    playsinline
    controls
    style="aspect-ratio: 16/9;"
  >
    <source src={video.hlsManifestUrl || video.link} type="video/mp4" />
    {#if video.captions?.vttUrl}
      <track 
        kind="captions" 
        src={video.captions.vttUrl} 
        srclang="en" 
        label="English"
        default 
      />
    {/if}
  </video>
{/if}
```

### Step 2: Update Database Schema

Remove Muse.ai specific fields and add caption fields:

```sql
-- Remove Muse.ai metadata (if exists)
-- ALTER TABLE videos DROP COLUMN IF EXISTS muse_svid;
-- ALTER TABLE videos DROP COLUMN IF EXISTS muse_metadata;

-- Add caption fields (if not exists)
ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption_srt_url TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption_vtt_url TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption_transcript TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption_language VARCHAR(10);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption_status VARCHAR(20) DEFAULT 'pending';
```

### Step 3: Migrate Existing Videos

Create a migration script to process existing videos:

```typescript
// apps/api/scripts/migrate-from-muse.ts
import { videoProcessingQueue } from '@api/services/video/queue';
import { db } from '@cio/db';

async function migrateVideosFromMuse() {
  // Find all videos with Muse.ai metadata
  const videosWithMuse = await db
    .select()
    .from(videos)
    .where(isNotNull(videos.metadata))
    .where(like(videos.metadata, '%svid%'));

  console.log(`Found ${videosWithMuse.length} videos to migrate`);

  for (const video of videosWithMuse) {
    // If video already has captions, skip
    if (video.caption_vtt_url) {
      console.log(`Skipping ${video.id} - already has captions`);
      continue;
    }

    // Queue for re-processing with Whisper
    if (video.fileKey) {
      await videoProcessingQueue.add('encode-video', {
        fileKey: video.fileKey,
        userId: video.userId,
        migrateFromMuse: true,
      });
      console.log(`Queued ${video.id} for migration`);
    }
  }
}

migrateVideosFromMuse();
```

### Step 4: Update API Endpoints

Remove any Muse.ai API integration code and replace with Whisper-based processing.

### Step 5: Update Documentation

- Remove Muse.ai references from README
- Update API documentation
- Update user-facing docs

## Benefits After Migration

1. **Cost Savings**: No per-video charges
2. **Self-Hosted**: Full control over infrastructure
3. **Better Integration**: Captions generated alongside video encoding
4. **Consistency**: All videos use same player and caption system
5. **Flexibility**: Easy to adjust transcription settings

## Rollback Plan

If needed, you can temporarily keep both systems:

```svelte
{#if video.metadata?.svid && !video.captions?.vttUrl}
  <!-- Fallback to Muse.ai for videos not yet migrated -->
  <iframe src="https://muse.ai/embed/{video.metadata?.svid}?..." />
{:else}
  <!-- Use new self-hosted solution -->
  <video>
    <source src={video.hlsManifestUrl} />
    <track src={video.captions.vttUrl} />
  </video>
{/if}
```

## Timeline Recommendation

1. **Week 1**: Implement Whisper caption generation
2. **Week 2**: Update frontend to use new captions
3. **Week 3**: Migrate existing videos (background job)
4. **Week 4**: Remove Muse.ai code and dependencies
5. **Week 5**: Clean up and verify all videos working

## Cost Comparison

### Muse.ai
- **Setup**: Complex API integration
- **Cost**: Per-video pricing (varies)
- **Self-Hosting**: Not possible
- **Monthly (100 videos)**: ~$50-200+ depending on plan

### Whisper (Self-Hosted)
- **Setup**: Simple Docker container
- **Cost**: $0 (just server resources)
- **Self-Hosting**: ✅ Fully self-hosted
- **Monthly (100 videos)**: $0

## Next Steps

1. ✅ Implement Whisper caption generation (see CAPTION_GENERATION_GUIDE.md)
2. ✅ Update ComponentVideo.svelte to remove Muse.ai
3. ✅ Create migration script for existing videos
4. ✅ Test with sample videos
5. ✅ Deploy and monitor
