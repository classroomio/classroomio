<script lang="ts">
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  import { lesson } from '../../store/lessons';

  interface Props {
    video: any; // Video object from lesson.materials.videos
  }

  let { video }: Props = $props();

  let videoElement: HTMLVideoElement;
  let hls: any = $state(null);
  let isHLSSupported = $state(false);
  let fallbackUrl = $state('');
  let isLoading = $state(true);
  let error: string | null = $state(null);
  let hlsInitialized = $state(false);

  onMount(async () => {
    // Check if HLS.js is available and supported
    if (typeof window !== 'undefined' && (window as any).Hls) {
      isHLSSupported = (window as any).Hls.isSupported();
    }

    // Try HLS if supported and manifest exists
    if (isHLSSupported && video.type === 'upload' && video.key) {
      const manifestExists = await checkManifestExists();
      if (manifestExists) {
        await initHLSPlayer();
        return;
      }
    }

    // Fallback to direct URL
    if (video.link) {
      await initDirectPlayer(video.link);
      return;
    }

    // Generate new presigned URL if needed
    await initFallbackPlayer();
  });

  async function checkManifestExists(): Promise<boolean> {
    try {
      const manifestUrl = `${env.PUBLIC_SERVER_URL}/course/presign/hls/stream/${$lesson.id}/${encodeURIComponent(video.key)}`;
      const response = await fetch(manifestUrl, {
        method: 'HEAD',
        credentials: 'include' // Send cookies for authentication
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async function initDirectPlayer(url: string) {
    try {
      isLoading = true;
      error = null;

      fallbackUrl = url;
      videoElement.src = url;
      isLoading = false;
      hlsInitialized = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load video';
      isLoading = false;
    }
  }

  async function initHLSPlayer() {
    try {
      isLoading = true;
      error = null;

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
      hls.on(Hls.Events.ERROR, (event: string, data: any) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              // Fallback to direct URL on fatal error
              if (video.link) {
                initDirectPlayer(video.link);
              } else {
                initFallbackPlayer();
              }
              break;
          }
        }
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        isLoading = false;
        hlsInitialized = true;
      });
    } catch (err) {
      console.error('HLS initialization failed:', err);
      error = 'Failed to initialize HLS streaming';
      // If video.link exists, use it directly (no auth needed)
      if (video.link) {
        await initDirectPlayer(video.link);
      } else {
        await initFallbackPlayer();
      }
    }
  }

  async function initFallbackPlayer() {
    try {
      isLoading = true;
      error = null;

      // If video.link exists, use it directly (no auth needed)
      if (video.link) {
        await initDirectPlayer(video.link);
        return;
      }

      // Otherwise, generate a new presigned URL (uses cookies for auth)
      if (!video.key) {
        throw new Error('Video key is missing');
      }

      // Generate direct URL for fallback (uses cookies for authentication)
      const response = await fetch(`${env.PUBLIC_SERVER_URL}/course/presign/video/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Send cookies for authentication
        body: JSON.stringify({
          keys: [video.key]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to generate fallback URL';
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
        videoElement.src = fallbackUrl;
        isLoading = false;
        hlsInitialized = false;
      } else {
        throw new Error(result.message || 'Failed to generate fallback URL');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load video';
    } finally {
      isLoading = false;
    }
  }

  function handleVideoError() {
    if (!hlsInitialized) {
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
    src={fallbackUrl}
    onerror={handleVideoError}
    onloadstart={handleVideoLoadStart}
    oncanplay={handleVideoCanPlay}
    style="aspect-ratio: 16/9;"
  >
    <source src={fallbackUrl} type="video/mp4" />
    <track kind="captions" />
    Your browser does not support the video tag.
  </video>
</div>
