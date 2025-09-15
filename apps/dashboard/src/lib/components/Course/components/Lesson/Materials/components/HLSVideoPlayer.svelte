<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { apiClient } from '$lib/utils/services/api';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { getAccessToken } from '$lib/utils/functions/supabase';
  import { env } from '$env/dynamic/public';

  export let video: any; // Video object from lesson.materials.videos
  export let lessonId: string;

  let videoElement: HTMLVideoElement;
  let hls: any = null;
  let isHLSSupported = false;
  let fallbackUrl = '';
  let isLoading = true;
  let error: string | null = null;
  let hlsInitialized = false;

  // Check for HLS support
  onMount(async () => {
    // Check if HLS.js is available and supported
    if (typeof window !== 'undefined' && (window as any).Hls) {
      isHLSSupported = (window as any).Hls.isSupported();
    }

    if (isHLSSupported && video.type === 'upload' && video.key) {
      // Use HLS streaming for uploaded videos
      await initHLSPlayer();
    } else {
      // Fallback to direct URL for other video types or unsupported browsers
      await initFallbackPlayer();
    }
  });

  async function initHLSPlayer() {
    try {
      isLoading = true;
      error = null;

      // Get access token for authentication
      const accessToken = await getAccessToken();

      // Get HLS manifest URL
      const manifestUrl = `${env.PUBLIC_SERVER_URL}/course/presign/hls/stream/${lessonId}/${encodeURIComponent(video.key)}`;

      // Initialize HLS.js with custom loader for authentication
      const Hls = (window as any).Hls;
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        // Security: prevent easy downloading
        maxBufferSize: 60 * 1000 * 1000, // 60MB max buffer
        liveSyncDurationCount: 3,
        // Additional security options
        maxBufferHole: 0.1,
        maxSeekHole: 2,
        seekHoleNudgeDuration: 0.01,
        // Custom loader for authentication
        xhrSetup: (xhr: XMLHttpRequest, url: string) => {
          xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        }
      });

      // Load the manifest
      hls.loadSource(manifestUrl);
      hls.attachMedia(videoElement);

      // Add security event listeners
      hls.on(Hls.Events.ERROR, (event: string, data: any) => {
        console.error('HLS Error:', data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Fatal network error, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Fatal media error, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal error, cannot recover, falling back to direct URL');
              // Fallback to direct URL on fatal error
              initFallbackPlayer();
              break;
          }
        }
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed successfully');
        isLoading = false;
        hlsInitialized = true;
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        // Track successful segment loads for analytics
        // This can be used to detect if someone is trying to download segments
      });
    } catch (error) {
      console.error('HLS initialization failed:', error);
      error = 'Failed to initialize HLS streaming';
      // Fallback to direct URL
      await initFallbackPlayer();
    }
  }

  async function initFallbackPlayer() {
    try {
      isLoading = true;
      error = null;

      // Generate direct URL for fallback
      const response = await apiClient.post('/course/presign/download', {
        keys: [video.key]
      });

      if (response.data.success) {
        fallbackUrl = response.data.urls[video.key];
        videoElement.src = fallbackUrl;
        isLoading = false;
        hlsInitialized = false;

        console.log('Using fallback direct URL for video playback');
      } else {
        throw new Error(response.data.message || 'Failed to generate fallback URL');
      }
    } catch (error) {
      console.error('Fallback player initialization failed:', error);
      error = error instanceof Error ? error.message : 'Failed to load video';
      snackbar.error($t('course.navItem.lessons.materials.tabs.video.error_loading'));
    } finally {
      isLoading = false;
    }
  }

  function handleVideoError() {
    if (!hlsInitialized) {
      console.error('Video playback error, attempting fallback');
      initFallbackPlayer();
    }
  }

  function handleVideoLoadStart() {
    isLoading = true;
  }

  function handleVideoCanPlay() {
    isLoading = false;
    error = null;
  }

  onDestroy(() => {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  });
</script>

<div class="relative w-full">
  {#if isLoading}
    <div
      class="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
    >
      <div class="text-center">
        <div
          class="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"
        ></div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {$t('course.navItem.lessons.materials.tabs.video.loading')}
        </p>
      </div>
    </div>
  {/if}

  {#if error}
    <div
      class="absolute inset-0 z-10 flex items-center justify-center bg-red-50 dark:bg-red-900/20"
    >
      <div class="text-center">
        <p class="mb-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
        <button
          class="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
          on:click={() => initFallbackPlayer()}
        >
          {$t('course.navItem.lessons.materials.tabs.video.retry')}
        </button>
      </div>
    </div>
  {/if}

  <video
    bind:this={videoElement}
    class="plyr-video-trigger h-full w-full"
    controls
    playsinline
    preload="metadata"
    src={fallbackUrl}
    on:error={handleVideoError}
    on:loadstart={handleVideoLoadStart}
    on:canplay={handleVideoCanPlay}
  >
    <source src={fallbackUrl} type="video/mp4" />
    <track kind="captions" />
    Your browser does not support the video tag.
  </video>

  <!-- Security indicator (optional) -->
  {#if isHLSSupported && hlsInitialized}
    <div class="absolute right-2 top-2 rounded bg-green-600 px-2 py-1 text-xs text-white">
      {$t('course.navItem.lessons.materials.tabs.video.secure_streaming')}
    </div>
  {/if}
</div>

<style>
  .plyr-video-trigger {
    background: #000;
  }
</style>
