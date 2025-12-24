<script lang="ts">
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  import { lesson } from '../../store/lessons';

  interface Props {
    video: any;
  }

  let { video }: Props = $props();

  let videoElement: HTMLVideoElement;
  let hls: any = $state(null);
  let isHLSSupported = $state(false);
  let fallbackUrl = $state('');
  let isLoading = $state(true);
  let error: string | null = $state(null);
  let hlsInitialized = $state(false);
  let hlsAttempted = $state(false);

  onMount(async () => {
    // Check if HLS.js is available and supported
    if (typeof window !== 'undefined' && (window as any).Hls) {
      isHLSSupported = (window as any).Hls.isSupported();
    }

    // Try HLS first if supported and we have the required data
    if (isHLSSupported && video.type === 'upload' && video.key) {
      await initHLSPlayer();
    } else {
      // No HLS support or missing data, go straight to fallback
      await initFallbackPlayer();
    }
  });

  async function initHLSPlayer() {
    if (hlsAttempted) return; // Prevent multiple HLS attempts

    try {
      isLoading = true;
      error = null;
      hlsAttempted = true;

      const manifestUrl = `${env.PUBLIC_SERVER_URL}/course/presign/hls/stream/${$lesson.id}/${encodeURIComponent(video.key)}`;

      const Hls = (window as any).Hls;
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        liveSyncDurationCount: 3,
        maxBufferHole: 0.1,
        maxSeekHole: 2,
        seekHoleNudgeDuration: 0.01,
        xhrSetup: (xhr: XMLHttpRequest) => {
          xhr.withCredentials = true;
        }
      });

      hls.loadSource(manifestUrl);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.ERROR, (_event: string, data: any) => {
        console.error('HLS Error:', data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Fatal network error, attempting fallback...');
              initFallbackPlayer();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              console.log('Fatal error, switching to fallback...');
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

      // Set a timeout in case manifest never loads
      const timeout = setTimeout(() => {
        if (!hlsInitialized && !fallbackUrl) {
          console.log('HLS timeout, switching to fallback...');
          initFallbackPlayer();
        }
      }, 5000); // 5 second timeout

      // Clean up timeout on success
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        clearTimeout(timeout);
      });
    } catch (err) {
      console.error('Failed to initialize HLS:', err);
      error = 'Failed to initialize HLS streaming';
      await initFallbackPlayer();
    }
  }

  async function initFallbackPlayer() {
    // Prevent initializing fallback if already initialized
    if (fallbackUrl) return;

    try {
      isLoading = true;
      error = null;

      // Destroy HLS instance if it exists
      if (hls) {
        hls.destroy();
        hls = null;
      }

      if (!video.key) {
        throw new Error('Video key is missing');
      }

      console.log('Initializing fallback player...');

      // Generate fresh presigned URL
      const response = await fetch(`${env.PUBLIC_SERVER_URL}/course/presign/video/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          keys: [video.key]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to generate video URL';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        fallbackUrl = result.urls[video.key];
        console.log('Fallback URL generated:', fallbackUrl);
        videoElement.src = fallbackUrl;
        isLoading = false;
        hlsInitialized = false;
      } else {
        throw new Error(result.message || 'Failed to generate video URL');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load video';
      isLoading = false;
    }
  }

  function handleVideoError(e: Event) {
    console.error('Video element error:', e);
    // Only try fallback if we haven't already set it
    if (!fallbackUrl) {
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

  $effect(() => {
    return () => {
      if (hls) {
        hls.destroy();
        hls = null;
      }
    };
  });
</script>

<div class="relative w-full">
  {#if isLoading}
    <div class="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div class="text-center">
        <div class="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p class="text-sm text-gray-600 dark:text-gray-400">Loading video...</p>
      </div>
    </div>
  {/if}

  {#if error}
    <div class="absolute inset-0 z-10 flex items-center justify-center bg-red-50 dark:bg-red-900/20">
      <div class="text-center">
        <p class="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          class="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
          onclick={() => initFallbackPlayer()}
        >
          Retry
        </button>
      </div>
    </div>
  {/if}

  <video
    bind:this={videoElement}
    class="plyr-video-trigger iframe h-full w-full"
    controls
    playsinline
    preload="metadata"
    onerror={handleVideoError}
    onloadstart={handleVideoLoadStart}
    oncanplay={handleVideoCanPlay}
    style="aspect-ratio: 16/9;"
  >
    {#if fallbackUrl}
      <source src={fallbackUrl} type="video/mp4" />
    {/if}
    <track kind="captions" />
    Your browser does not support the video tag.
  </video>
</div>
