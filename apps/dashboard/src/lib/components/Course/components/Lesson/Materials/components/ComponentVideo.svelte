<script lang="ts">
  import { onMount } from 'svelte';
  import { formatYoutubeVideo } from '$lib/utils/functions/formatYoutubeVideo';
  import { lesson } from '../../store/lessons';
  import HLSVideoPlayer from './HLSVideoPlayer.svelte';

  let errors: Record<string, string> = {};
  let videoElements: (HTMLVideoElement | null)[] = $state([]);

  $effect(() => {
    // Only count non-HLS videos for the videoElements array
    const nonHLSVideos = $lesson.materials.videos.filter((v) => !(v.type === 'upload' && v.key));
    if (videoElements.length !== nonHLSVideos.length) {
      videoElements = [
        ...videoElements.slice(0, nonHLSVideos.length),
        ...Array(Math.max(0, nonHLSVideos.length - videoElements.length)).fill(null)
      ];
    }
  });

  // causes cyclic dependency because of videoelemnt still being referenced while being derived
  // let videoElements: (HTMLVideoElement | null)[] = $derived.by(() => {
  //   let elements = videoElements.slice(0, $lesson.materials.videos.length);
  //   return [...elements, ...Array($lesson.materials.videos.length - elements.length).fill(null)];
  // });

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

{#if $lesson.materials.videos.length}
  <div class="w-full">
    {#each $lesson.materials.videos as video, index}
      {@const isHLSVideo = video.type === 'upload' && video.key}
      {@const nonHLSIndex = $lesson.materials.videos
        .slice(0, index)
        .filter((v) => !(v.type === 'upload' && v.key)).length}
      <div class="mb-5 w-full overflow-hidden">
        {#key video.link || video.key}
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
            {:else if isHLSVideo}
              <!-- Use HLS player for uploaded videos with key (processed videos) -->
              <HLSVideoPlayer {video} />
            {:else}
              <video
                bind:this={videoElements[nonHLSIndex]}
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
