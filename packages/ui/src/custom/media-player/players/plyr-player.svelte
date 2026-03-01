<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import 'plyr/dist/plyr.css';
  import type { MediaPlayerOptions } from '../types';
  import { getYoutubeVideoId, isYoutubeUrl } from '../utils';
  import { PLYR_DEFAULT_CONTROLS } from './constants';
  import type Plyr from 'plyr';

  interface Props {
    src: string;
    poster?: string;
    options?: MediaPlayerOptions;
  }

  let { src, poster, options = {} }: Props = $props();

  let videoElement = $state<HTMLVideoElement | null>(null);
  let containerElement = $state<HTMLDivElement | null>(null);
  let playerInstance = $state<Plyr | null>(null);

  const playsinline = $derived(options.playsinline !== false);
  const maxHeight = $derived(options.maxHeight || '400px');
  const showControls = $derived(options.controls !== false);
  const autoplay = $derived(options.autoplay === true);

  const isYouTube = $derived(isYoutubeUrl(src));
  const youtubeVideoId = $derived(isYouTube ? getYoutubeVideoId(src) : null);

  onMount(async () => {
    const PlyrModule = await import('plyr');
    const PlyrConstructor = PlyrModule.default;
    const controls = showControls ? PLYR_DEFAULT_CONTROLS : [];

    if (isYouTube && youtubeVideoId && containerElement) {
      playerInstance = new PlyrConstructor(containerElement, {
        controls,
        autoplay,
        ratio: '16:9',
        iconUrl: '/plyr.svg',
        iconPrefix: 'plyr'
      });
      return;
    }

    if (videoElement) {
      playerInstance = new PlyrConstructor(videoElement, {
        controls,
        autoplay,
        ratio: '16:9',
        iconUrl: '/plyr.svg',
        iconPrefix: 'plyr'
      });
    }
  });

  onDestroy(() => {
    if (!playerInstance) return;

    try {
      if (playerInstance.isEmbed && playerInstance.playing) {
        playerInstance.pause();
      }
    } catch {
      // No-op for player teardown safety.
    }

    try {
      playerInstance.destroy();
    } finally {
      playerInstance = null;
    }
  });
</script>

<div
  class="ui:relative ui:rounded-md"
  style="max-height: {maxHeight}; min-height: {options.minHeight}; height: {options.height};"
>
  {#if isYouTube && youtubeVideoId}
    <div
      bind:this={containerElement}
      class="plyr__video-embed"
      data-plyr-provider="youtube"
      data-plyr-embed-id={youtubeVideoId}
    ></div>
  {:else}
    <!-- svelte-ignore a11y_media_has_caption -->
    <video bind:this={videoElement} {src} {poster} {playsinline} class="plyr-player"></video>
  {/if}
</div>
