<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import 'plyr/dist/plyr.css';
  import type { MediaPlayerOptions } from '../types';
  import { isYoutubeUrl, getYoutubeVideoId } from '../utils';
  import { PLYR_DEFAULT_CONTROLS } from './constants';
  import { classroomio } from '$lib/utils/services/api';
  import type Plyr from 'plyr';

  /**
   * Resolve an HLS source. The caller passes either a full URL or the
   * relative shape `/hls/{assetId}/{rest}` we store in `lesson.videos[].link`.
   * Routes through the typed Hono client so playback uses the same base
   * URL as every other API call — direct to `PUBLIC_SERVER_URL` in local dev,
   * and `${origin}/proxy/...` in production. Cloud tenant-router intercepts
   * `/proxy/hls/*` and serves directly from R2.
   *
   * Hono's `$url()` only substitutes named `:params`, leaving wildcards as
   * a literal `/*` suffix — we strip it and append the real path.
   */
  function resolveHlsUrl(src: string): string {
    if (/^https?:\/\//i.test(src)) return src;

    const match = src.match(/^\/?hls\/([^/]+)\/(.+)$/);
    if (!match) return src;

    const [, assetId, rest] = match;
    const built = classroomio.hls[':assetId']['*'].$url({ param: { assetId } });
    return built.toString().replace(/\/\*$/, '') + '/' + rest;
  }

  interface Props {
    src: string;
    poster?: string;
    /**
     * When true, `src` points at an HLS master playlist (.m3u8) and the
     * player attaches hls.js to handle adaptive bitrate streaming.
     */
    hls?: boolean;
    options?: MediaPlayerOptions;
  }

  let { src, poster, hls = false, options = {} }: Props = $props();
  let videoElement: HTMLVideoElement | null = null;
  let containerElement: HTMLDivElement | null = null;
  let playerInstance: Plyr | null = null;
  let hlsInstance: import('hls.js').default | null = null;

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
        ratio: '16:9',
        iconUrl: '/plyr.svg',
        iconPrefix: 'plyr'
      });
    } else if (videoElement) {
      // For HLS, attach hls.js to feed the manifest into the video element
      // before Plyr wraps it. Safari uses the native HLS playback path
      // (`canPlayType('application/vnd.apple.mpegurl')`), no hls.js needed.
      if (hls) {
        const hlsUrl = resolveHlsUrl(src);
        const supportsNativeHls = videoElement.canPlayType('application/vnd.apple.mpegurl') !== '';
        if (supportsNativeHls) {
          // Native HLS (Safari) — set src here since the markup branch sees
          // canPlayType before videoElement mounts and may render undefined.
          videoElement.src = hlsUrl;
        } else {
          const HlsModule = await import('hls.js');
          const Hls = HlsModule.default;
          if (Hls.isSupported()) {
            hlsInstance = new Hls({
              enableWorker: true,
              // Browser needs to send session cookies to the API when the
              // dashboard is on a different origin (dev / self-hosted).
              xhrSetup: (xhr) => {
                xhr.withCredentials = true;
              }
            });
            hlsInstance.loadSource(hlsUrl);
            hlsInstance.attachMedia(videoElement);
          } else {
            videoElement.src = hlsUrl;
          }
        }
      }

      // For regular HTML5 video
      // playsinline is set as an HTML attribute on the video element, not a Plyr option
      playerInstance = new Plyr(videoElement, {
        controls: plyrControls,
        autoplay: autoplay,
        ratio: '16:9',
        iconUrl: '/plyr.svg',
        iconPrefix: 'plyr'
      });
    }
  });

  onDestroy(() => {
    if (hlsInstance) {
      try {
        hlsInstance.destroy();
      } catch {
        // Ignore — hls.js may have already torn itself down.
      } finally {
        hlsInstance = null;
      }
    }
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
    <!-- For HLS, hls.js or native HLS attaches programmatically in onMount; the bare <video> has no src here. -->
    {#if hls}
      <video bind:this={videoElement} {poster} {playsinline} class="plyr-player"></video>
    {:else}
      <video bind:this={videoElement} {src} {poster} {playsinline} class="plyr-player"></video>
    {/if}
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
