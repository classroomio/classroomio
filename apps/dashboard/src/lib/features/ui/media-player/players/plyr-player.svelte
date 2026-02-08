<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import 'plyr/dist/plyr.css';
  import type { MediaPlayerOptions } from '../types';
  import { isYoutubeUrl, getYoutubeVideoId } from '../utils';
  import { PLYR_DEFAULT_CONTROLS } from './constants';
  import type Plyr from 'plyr';

  interface Props {
    src: string;
    options?: MediaPlayerOptions;
  }

  let { src, options = {} }: Props = $props();
  let videoElement: HTMLVideoElement | null = null;
  let containerElement: HTMLDivElement | null = null;
  let playerInstance: Plyr | null = null;

  const playsinline = $derived(options.playsinline !== false);
  const maxHeight = $derived(options.maxHeight || '400px');
  const showControls = $derived(options.controls !== false);
  const autoplay = $derived(options.autoplay === true);

  const isYouTube = $derived(isYoutubeUrl(src));
  const youtubeVideoId = $derived(isYouTube ? getYoutubeVideoId(src) : null);

  onMount(async () => {
    // Dynamically import Plyr only on the client side to avoid SSR issues
    const PlyrModule = await import('plyr');
    const Plyr = PlyrModule.default;

    // Plyr expects controls as an array, not a boolean
    const plyrControls: string[] = showControls ? PLYR_DEFAULT_CONTROLS : [];

    if (isYouTube && youtubeVideoId && containerElement) {
      // For YouTube, use Plyr's YouTube embed support
      playerInstance = new Plyr(containerElement, {
        controls: plyrControls,
        autoplay: autoplay,
        ratio: '16:9' // Or '16:9', '1:1', etc.
      });
    } else if (videoElement) {
      // For regular HTML5 video
      // playsinline is set as an HTML attribute on the video element, not a Plyr option
      playerInstance = new Plyr(videoElement, {
        controls: plyrControls,
        autoplay: autoplay,
        ratio: '16:9' // Or '16:9', '1:1', etc.
      });
    }
  });

  onDestroy(() => {
    if (playerInstance) {
      try {
        // Check if player is an embed (YouTube/Vimeo) and handle accordingly
        if (playerInstance.isEmbed) {
          // For embed players, try to stop first if possible
          try {
            if (playerInstance.playing) {
              playerInstance.pause();
            }
          } catch (e) {
            // Ignore errors when pausing embed players
          }
        }
        // Destroy the player instance
        playerInstance.destroy();
      } catch (error) {
        // Silently handle errors during destruction
        // YouTube player might not be ready when component unmounts
      } finally {
        playerInstance = null;
      }
    }
  });
</script>

<div class="relative" style="max-height: {maxHeight}; min-height: {options.minHeight}; height: {options.height};">
  {#if isYouTube && youtubeVideoId}
    <!-- YouTube embed using Plyr's progressive enhancement -->
    <div
      bind:this={containerElement}
      class="plyr__video-embed"
      data-plyr-provider="youtube"
      data-plyr-embed-id={youtubeVideoId}
    ></div>
  {:else}
    <!-- HTML5 video -->
    <!-- svelte-ignore a11y_media_has_caption -->
    <video bind:this={videoElement} {src} {playsinline} crossorigin="anonymous" class="plyr-player"></video>
  {/if}

  <!-- ClassroomIO Logo Overlay -->
  <div
    class="plyr-logo-overlay absolute top-2 right-2 z-10 opacity-90 transition-opacity duration-200 ease-in-out hover:opacity-100"
  >
    <img src="/logo-192.png" alt="ClassroomIO" class="h-7 w-7 rounded-sm bg-white/90 p-0.5 shadow-sm" />
  </div>
</div>

<style>
  /* Hide logo when controls are hidden (if needed) */
  :global(.plyr--hide-controls) ~ .plyr-logo-overlay {
    opacity: 0.7;
  }
</style>
