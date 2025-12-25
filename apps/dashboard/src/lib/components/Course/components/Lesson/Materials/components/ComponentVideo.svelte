<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { formatYoutubeVideo } from '$lib/utils/functions/formatYoutubeVideo';
  import { lesson } from '../../store/lessons';
  import Hls from 'hls.js';

  let errors: Record<string, string> = {};
  let videoElements: (HTMLVideoElement | null)[] = $derived.by(() => {
    let elements = videoElements.slice(0, $lesson.materials.videos.length);
    return [...elements, ...Array($lesson.materials.videos.length - elements.length).fill(null)];
  });
  let hlsInstances: (Hls | null)[] = [];

  function initPlyr() {
    if (typeof (window as any).Plyr === 'undefined') {
      console.warn('Plyr is not defined. Make sure it is properly imported.');
      return;
    }
    const players = Array.from(document.querySelectorAll('.plyr-video-trigger')).map(
      (p) => new (window as any).Plyr(p as HTMLElement)
    );
    if (typeof window !== 'undefined') {
      (window as any).players = players;
    }
  }

  function initHLS(videoElement: HTMLVideoElement, video: any, index: number) {
    // Use HLS manifest if available, otherwise fall back to regular video
    if (video.hlsManifestUrl || video.hls_manifest_url) {
      const hlsUrl = video.hlsManifestUrl || video.hls_manifest_url;

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        });

        hls.loadSource(hlsUrl);
        hls.attachMedia(videoElement);

        // Add captions if available
        if (video.captions?.vttUrl || video.caption_vtt_url) {
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            const track = document.createElement('track');
            track.kind = 'captions';
            track.label = 'English';
            track.srclang = video.captions?.language || video.caption_language || 'en';
            track.src = video.captions?.vttUrl || video.caption_vtt_url;
            track.default = true;
            videoElement.appendChild(track);
          });
        }

        hlsInstances[index] = hls;
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        videoElement.src = hlsUrl;
        if (video.captions?.vttUrl || video.caption_vtt_url) {
          const track = document.createElement('track');
          track.kind = 'captions';
          track.label = 'English';
          track.srclang = video.captions?.language || video.caption_language || 'en';
          track.src = video.captions?.vttUrl || video.caption_vtt_url;
          track.default = true;
          videoElement.appendChild(track);
        }
      }
    } else if (video.link) {
      // Regular video with captions
      videoElement.src = video.link;
      if (video.captions?.vttUrl || video.caption_vtt_url) {
        const track = document.createElement('track');
        track.kind = 'captions';
        track.label = 'English';
        track.srclang = video.captions?.language || video.caption_language || 'en';
        track.src = video.captions?.vttUrl || video.caption_vtt_url;
        track.default = true;
        videoElement.appendChild(track);
      }
    }
  }

  onMount(() => {
    initPlyr();
    // Initialize HLS for videos that need it
    videoElements.forEach((element, index) => {
      if (element && $lesson.materials.videos[index]) {
        initHLS(element, $lesson.materials.videos[index], index);
      }
    });
  });

  onDestroy(() => {
    // Cleanup HLS instances
    hlsInstances.forEach((hls) => {
      if (hls) {
        hls.destroy();
      }
    });
  });
</script>

{#if $lesson.materials.videos.length}
  <div class="w-full">
    {#each $lesson.materials.videos as video, index}
      <div class="mb-5 w-full overflow-hidden">
        {#key video.link}
          <div class="mb-5">
            {#if video.type === 'youtube'}
              <iframe
                class="iframe"
                src={formatYoutubeVideo(video.link, errors)}
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            {:else if video.type === 'generic'}
              <iframe
                width="100%"
                height="569"
                class="iframe"
                src={video.link}
                title="Embeded Video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            {:else}
              <video
                bind:this={videoElements[index]}
                class="plyr-video-trigger iframe h-full w-full"
                playsinline
                controls
                style="aspect-ratio: 16/9;"
              >
                <source src={video.link} type="video/mp4" />
                <track kind="captions" />
              </video>
            {/if}
          </div>
        {/key}
      </div>
    {/each}
  </div>
{/if}
