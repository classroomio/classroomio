<script lang="ts">
  import { onMount } from 'svelte';
  import { formatYoutubeVideo } from '$lib/utils/functions/formatYoutubeVideo';
  import { lessonApi } from '$features/course/api';

  let errors: Record<string, string> = {};
  const videos = $derived(lessonApi.lesson?.videos || []);
  let videoElements: (HTMLVideoElement | null)[] = $state([]);

  $effect(() => {
    videoElements = [
      ...videoElements.slice(0, videos.length),
      ...Array(Math.max(0, videos.length - videoElements.length)).fill(null)
    ];
  });

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

  onMount(() => {
    initPlyr();
  });
</script>

{#if videos.length}
  <div class="w-full">
    {#each videos as video, index}
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
            {:else if video.metadata?.svid}
              <div style="position:relative;padding-bottom:51.416579%">
                <iframe
                  src="https://muse.ai/embed/{video.metadata
                    ?.svid}?logo=https://app.classroomio.com/logo-512.png&subtitles=auto&cover_play_position=center"
                  style="width:100%;height:100%;position:absolute;left:0;top:0"
                  frameborder="0"
                  allowfullscreen
                  title="Muse AI Video Embed"
                ></iframe>
              </div>
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
