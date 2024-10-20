<script lang="ts">
  import { onMount } from 'svelte';
  import { formatYoutubeVideo } from '$lib/utils/functions/formatYoutubeVideo';
  import { lesson } from '../../store/lessons';
  import { signedVideoUrls } from '../store';

  let errors: Record<string, string> = {};
  let videoElements: (HTMLVideoElement | null)[] = [];

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

  function updateVideoSources() {
    videoElements.forEach((videoElement, index) => {
      if (videoElement && $lesson.materials.videos[index]) {
        const video = $lesson.materials.videos[index];
        const signedUrl = $signedVideoUrls[video.videoKey];
        if (signedUrl && videoElement.src !== signedUrl) {
          videoElement.src = signedUrl;
          videoElement.load();
        }
      }
    });
    initPlyr();
  }

  $: if ($signedVideoUrls) {
    updateVideoSources();
  }

  $: {
    videoElements = videoElements.slice(0, $lesson.materials.videos.length);
    videoElements = [
      ...videoElements,
      ...Array($lesson.materials.videos.length - videoElements.length).fill(null)
    ];
  }

  onMount(() => {
    initPlyr();
  });
</script>

{#if $lesson.materials.videos.length}
  <div class="w-full">
    {#each $lesson.materials.videos as video, index}
      <div class="w-full overflow-hidden mb-5">
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
              />
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
              />
            {:else if video.metadata?.svid}
              <div style="position:relative;padding-bottom:51.416579%">
                <iframe
                  src="https://muse.ai/embed/{video.metadata
                    ?.svid}?logo=https://app.classroomio.com/logo-512.png&subtitles=auto&cover_play_position=center"
                  style="width:100%;height:100%;position:absolute;left:0;top:0"
                  frameborder="0"
                  allowfullscreen
                  title="Muse AI Video Embed"
                />
              </div>
            {:else}
              <video
                bind:this={videoElements[index]}
                class="plyr-video-trigger"
                playsinline
                controls
              >
                <source src={$signedVideoUrls[video.videoKey] || video.link} type="video/mp4" />
                <track kind="captions" />
              </video>
            {/if}
          </div>
        {/key}
      </div>
    {/each}
  </div>
{/if}
