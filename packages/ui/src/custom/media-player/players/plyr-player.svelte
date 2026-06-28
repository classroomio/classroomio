<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import 'plyr/dist/plyr.css';
  import CaptionsIcon from '@lucide/svelte/icons/captions';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import type { MediaPlayerOptions, VideoTextTrack } from '../types';
  import { getYoutubeVideoId, isYoutubeUrl } from '../utils';
  import { PLYR_DEFAULT_CONTROLS } from './constants';
  import { Button } from '../../../base/button';
  import type Plyr from 'plyr';

  interface Props {
    src: string;
    poster?: string;
    /**
     * When true, `src` is an HLS master playlist (.m3u8). The player
     * attaches hls.js (or uses native HLS on Safari) instead of setting
     * the URL on the `<video>` element directly. Cookie minting (if any)
     * happens via `options.onBeforeHlsLoad`.
     */
    hls?: boolean;
    options?: MediaPlayerOptions;
    tracks?: VideoTextTrack[];
  }

  let { src, poster, hls = false, options = {}, tracks = [] }: Props = $props();

  let hlsInstance = $state<import('hls.js').default | null>(null);

  let videoElement = $state<HTMLVideoElement | null>(null);
  let containerElement = $state<HTMLDivElement | null>(null);
  let playerInstance = $state<Plyr | null>(null);
  let transcriptButtonElement = $state<HTMLButtonElement | null>(null);
  let playbackFailed = $state(false);
  let playbackAuthExpired = $state(false);
  let isPlayerReady = $state(false);
  let reloadInFlight = $state(false);
  let timeupdateCleanup: (() => void) | undefined;
  let firstPlayCleanup: (() => void) | undefined;
  let transcriptPanelCleanup: (() => void) | undefined;
  let mediaErrorCleanup: (() => void) | undefined;
  let plyrErrorCleanup: (() => void) | undefined;
  let loadedSrc = $state<string | null>(null);
  let hlsLoadGeneration = 0;
  let hlsPlyrGeneration = 0;
  let plyrConstructInFlight = false;
  let hasFiredFirstPlay = false;
  let isMounted = false;
  let youtubeInitGeneration = 0;

  const SEEK_TOLERANCE_SECONDS = 0.5;
  /**
   * Furthest watched position for the must-watch lock. Shared between the
   * progress-bar `seek` listener (set at Plyr construction) and the playback
   * tracker in `attachSeekEnforcement`, which advances it as the user watches.
   */
  let seekLockFurthestSeconds = options.seekPolicy?.initialFurthestSeconds ?? 0;

  /**
   * Plyr progress-bar seek handler. Returning `false` skips Plyr's default
   * seek, so the media never moves — the reliable way to block forward
   * skips (clamping `currentTime` after the fact is ignored on progressive
   * MP4). Rewinding and re-seeking up to the watched point stay allowed.
   */
  function handleSeekAttempt(event: Event): boolean | void {
    const policy = options.seekPolicy;
    if (policy?.mode !== 'locked_until_complete') return;

    const input = event.currentTarget as HTMLInputElement | null;
    const duration = playerInstance?.duration;
    if (!input || !duration || !Number.isFinite(duration)) return;

    const max = Number(input.max) || 100;
    const raw = input.getAttribute('seek-value') ?? input.value;
    const targetSeconds = (Number(raw) / max) * duration;

    if (targetSeconds > seekLockFurthestSeconds + SEEK_TOLERANCE_SECONDS) {
      policy.onSeekBlocked?.();
      return false;
    }
  }

  interface HlsQualityConfig {
    default: number;
    options: number[];
    forced: boolean;
    onChange: (height: number) => void;
  }

  const playsinline = $derived(options.playsinline !== false);
  const maxHeight = $derived(options.maxHeight || '400px');
  const showControls = $derived(options.controls !== false);
  const autoplay = $derived(options.autoplay === true);

  const isYouTube = $derived(isYoutubeUrl(src));
  const youtubeVideoId = $derived(isYouTube ? getYoutubeVideoId(src) : null);

  function attachTimeUpdates(player: Plyr, element: HTMLVideoElement): () => void {
    const policy = options.seekPolicy;
    if (policy?.mode === 'locked_until_complete') {
      return attachSeekEnforcement(player, element, policy);
    }

    const handler = () => options.onTimeUpdate?.(player.currentTime);
    player.on('timeupdate', handler);
    return () => {
      player.off('timeupdate', handler);
    };
  }

  function attachSeekEnforcement(
    player: Plyr,
    element: HTMLVideoElement,
    policy: NonNullable<MediaPlayerOptions['seekPolicy']>
  ): () => void {
    seekLockFurthestSeconds = policy.initialFurthestSeconds ?? 0;
    let playedSeconds = 0;
    let lastValidTime = element.currentTime;
    let isSeeking = false;
    let isReclamping = false;
    let seekBlockNotified = false;
    let lastHeartbeatAt = 0;
    const heartbeatIntervalMs = 15_000;

    const flushProgress = (force = false) => {
      const durationSeconds = element.duration;
      if (!durationSeconds || !Number.isFinite(durationSeconds)) return;

      const now = Date.now();
      if (!force && now - lastHeartbeatAt < heartbeatIntervalMs) return;

      lastHeartbeatAt = now;
      policy.onProgress?.({
        positionSeconds: Math.floor(player.currentTime),
        playedDeltaSeconds: Math.round(playedSeconds),
        durationSeconds: Math.round(durationSeconds)
      });
      playedSeconds = 0;
    };

    const isAheadOfLimit = () => player.currentTime > seekLockFurthestSeconds + SEEK_TOLERANCE_SECONDS;

    const notifySeekBlocked = () => {
      if (seekBlockNotified) return;

      seekBlockNotified = true;
      policy.onSeekBlocked?.();
    };

    // Backstop for seeks that bypass the progress-bar listener (keyboard
    // shortcuts, programmatic). The progress bar itself is blocked up-front
    // by the `seek` listener wired at construction.
    const onSeeking = () => {
      isSeeking = true;
      if (isReclamping) return;

      if (isAheadOfLimit()) {
        notifySeekBlocked();
        player.currentTime = seekLockFurthestSeconds;
      }
    };

    const onSeeked = () => {
      if (isReclamping) {
        isReclamping = false;
        isSeeking = false;
        seekBlockNotified = false;
        lastValidTime = player.currentTime;
        return;
      }

      if (isAheadOfLimit()) {
        isReclamping = true;
        notifySeekBlocked();
        player.currentTime = seekLockFurthestSeconds;
        return;
      }

      isSeeking = false;
      seekBlockNotified = false;
      lastValidTime = player.currentTime;
    };

    const onTimeUpdate = () => {
      if (isSeeking) return;

      const current = player.currentTime;
      const delta = current - lastValidTime;

      if (delta > 0 && delta < 2) {
        playedSeconds += delta;
        seekLockFurthestSeconds = Math.max(seekLockFurthestSeconds, current);
      }

      lastValidTime = current;
      options.onTimeUpdate?.(current);
      flushProgress(false);
    };

    const onRateChange = () => {
      if (player.speed !== 1) {
        player.speed = 1;
      }
    };

    const onPause = () => flushProgress(true);

    const onEnded = () => {
      const durationSeconds = element.duration;
      if (durationSeconds && Number.isFinite(durationSeconds)) {
        const tailSeconds = durationSeconds - lastValidTime;
        if (tailSeconds > 0) {
          playedSeconds += tailSeconds;
        }
        seekLockFurthestSeconds = Math.max(seekLockFurthestSeconds, durationSeconds);
        lastValidTime = durationSeconds;
      }

      flushProgress(true);
    };

    player.on('seeking', onSeeking);
    player.on('seeked', onSeeked);
    player.on('timeupdate', onTimeUpdate);
    player.on('ratechange', onRateChange);
    player.on('pause', onPause);
    player.on('ended', onEnded);

    return () => {
      flushProgress(true);
      player.off('seeking', onSeeking);
      player.off('seeked', onSeeked);
      player.off('timeupdate', onTimeUpdate);
      player.off('ratechange', onRateChange);
      player.off('pause', onPause);
      player.off('ended', onEnded);
    };
  }

  function getPlyrControls(): string[] {
    if (!showControls) return [];

    return PLYR_DEFAULT_CONTROLS;
  }

  function handleVisibilityChange(): void {
    if (!options.seekPolicy?.pauseOnHidden) return;
    if (!document.hidden) return;

    try {
      playerInstance?.pause();
    } catch {
      // Player may be mid-teardown.
    }
  }

  function handleWindowBlur(): void {
    if (!options.seekPolicy?.pauseOnHidden) return;

    try {
      playerInstance?.pause();
    } catch {
      // Player may be mid-teardown.
    }
  }

  function attachFirstPlay(player: Plyr): () => void {
    const handler = () => {
      if (hasFiredFirstPlay) return;

      hasFiredFirstPlay = true;
      options.onFirstPlay?.();
    };
    player.on('play', handler);
    return () => {
      player.off('play', handler);
    };
  }

  function handlePlaybackFailure(): void {
    if (playbackFailed) return;

    playbackFailed = true;
  }

  async function handlePlaybackReloadClick(): Promise<void> {
    if (reloadInFlight || !options.onPlaybackReload) return;

    reloadInFlight = true;

    try {
      const reloaded = await options.onPlaybackReload();
      if (!reloaded) return;

      playbackFailed = false;

      if (videoElement && !isYouTube) {
        loadedSrc = null;
        videoElement.load();
      }
    } finally {
      reloadInFlight = false;
    }
  }

  function attachMediaErrorHandler(element: HTMLVideoElement): () => void {
    const handler = () => {
      handlePlaybackFailure();
    };
    element.addEventListener('error', handler);
    return () => {
      element.removeEventListener('error', handler);
    };
  }

  function attachPlyrErrorHandler(player: Plyr): () => void {
    const handler = () => {
      handlePlaybackFailure();
    };
    player.on('error', handler);
    return () => {
      player.off('error', handler);
    };
  }

  function attachTranscriptPanelControl(
    player: Plyr,
    template: HTMLButtonElement,
    control: NonNullable<MediaPlayerOptions['transcriptPanelControl']>
  ): () => void {
    type PlyrElements = { controls?: HTMLElement | null };
    const controls = (player as unknown as { elements: PlyrElements }).elements?.controls;

    if (!controls) return () => {};

    controls.querySelector('[data-cio-transcript-panel]')?.remove();

    const button = template.cloneNode(true) as HTMLButtonElement;
    button.removeAttribute('hidden');

    const onClick = (event: MouseEvent) => {
      event.stopPropagation();
      control.onClick();
    };
    button.addEventListener('click', onClick);

    const fullscreen = controls.querySelector('[data-plyr="fullscreen"]');
    if (fullscreen) {
      fullscreen.insertAdjacentElement('beforebegin', button);
    } else {
      controls.appendChild(button);
    }

    return () => {
      button.removeEventListener('click', onClick);
      button.remove();
    };
  }

  function teardownPlyrInstance(): void {
    timeupdateCleanup?.();
    firstPlayCleanup?.();
    transcriptPanelCleanup?.();
    plyrErrorCleanup?.();
    mediaErrorCleanup?.();
    timeupdateCleanup = undefined;
    firstPlayCleanup = undefined;
    transcriptPanelCleanup = undefined;
    plyrErrorCleanup = undefined;
    mediaErrorCleanup = undefined;
    isPlayerReady = false;
    if (!playerInstance) return;

    try {
      playerInstance.destroy();
    } catch {
      // Plyr may be mid-teardown if the user closed the dialog.
    } finally {
      playerInstance = null;
    }
  }

  async function constructPlyrForVideoElement(qualityConfig?: HlsQualityConfig): Promise<void> {
    if (!videoElement || playerInstance || plyrConstructInFlight) return;

    plyrConstructInFlight = true;

    const PlyrModule = await import('plyr');
    const PlyrConstructor = PlyrModule.default;
    const controls = getPlyrControls();

    try {
      // Recheck after the dynamic import resolves — the component may have
      // unmounted (or the videoElement bind nulled out) while we awaited.
      if (!isMounted || !videoElement || playerInstance) return;

      mediaErrorCleanup = attachMediaErrorHandler(videoElement);

      playerInstance = new PlyrConstructor(videoElement, {
        controls,
        autoplay,
        // Match the YouTube branch: force 16:9 so non-16:9 sources (e.g.
        // screen recordings at 4:3 or 5:4) get letterboxed inside the player
        // container rather than overflowing it and clipping the controls.
        ratio: '16:9',
        iconUrl: '/plyr.svg',
        iconPrefix: 'plyr',
        ...(options.seekPolicy?.mode === 'locked_until_complete' ? { listeners: { seek: handleSeekAttempt } } : {}),
        ...(qualityConfig
          ? {
              quality: qualityConfig,
              i18n: { qualityLabel: { 0: 'Auto' } }
            }
          : {})
      });
      timeupdateCleanup = attachTimeUpdates(playerInstance, videoElement);
      firstPlayCleanup = attachFirstPlay(playerInstance);
      plyrErrorCleanup = attachPlyrErrorHandler(playerInstance);
      playerInstance.on('ready', () => {
        isPlayerReady = true;
      });
      options.onPlayerReady?.(playerInstance);
    } finally {
      plyrConstructInFlight = false;
    }
  }

  async function initHlsPlyr(hls: import('hls.js').default, loadGeneration: number): Promise<void> {
    if (loadGeneration !== hlsLoadGeneration || hlsInstance !== hls) return;
    if (hlsPlyrGeneration === loadGeneration) return;

    hlsPlyrGeneration = loadGeneration;

    const heights = Array.from(new Set(hls.levels.map((level) => level.height).filter((height) => height > 0))).sort(
      (a, b) => a - b
    );

    if (loadGeneration !== hlsLoadGeneration || hlsInstance !== hls || !videoElement) return;

    if (!heights.length) {
      await constructPlyrForVideoElement();
      return;
    }

    await constructPlyrForVideoElement({
      default: 0,
      options: [0, ...heights],
      forced: true,
      onChange: (height: number) => {
        if (hlsInstance !== hls) return;

        if (height === 0) {
          hls.currentLevel = -1;
          return;
        }

        const levelIndex = hls.levels.findIndex((level) => level.height === height);
        if (levelIndex >= 0) hls.currentLevel = levelIndex;
      }
    });
  }

  async function constructPlyrForYouTubeEmbed(): Promise<void> {
    if (!isMounted || !containerElement || !youtubeVideoId || playerInstance || plyrConstructInFlight) return;

    const initGeneration = youtubeInitGeneration;
    plyrConstructInFlight = true;

    const PlyrModule = await import('plyr');
    const PlyrConstructor = PlyrModule.default;
    const controls = getPlyrControls();

    try {
      if (!isMounted || initGeneration !== youtubeInitGeneration || !containerElement || playerInstance) {
        return;
      }

      playerInstance = new PlyrConstructor(containerElement, {
        controls,
        autoplay,
        ratio: '16:9',
        iconUrl: '/plyr.svg',
        iconPrefix: 'plyr'
      });
      timeupdateCleanup = attachTimeUpdates(playerInstance);
      firstPlayCleanup = attachFirstPlay(playerInstance);
      plyrErrorCleanup = attachPlyrErrorHandler(playerInstance);
      playerInstance.on('ready', () => {
        isPlayerReady = true;
      });
      options.onPlayerReady?.(playerInstance);
    } finally {
      plyrConstructInFlight = false;
    }
  }

  onMount(() => {
    isMounted = true;

    void (async () => {
      if (isYouTube && youtubeVideoId && containerElement) {
        await constructPlyrForYouTubeEmbed();
        return;
      }

      // HLS sources defer Plyr until hls.js parses the manifest — Plyr's
      // quality menu must be configured at construction time, and tearing
      // the player down after hls.js attaches breaks the video wrapper.
      if (!hls && videoElement) {
        await constructPlyrForVideoElement();
      }
    })();
  });

  /**
   * Imperative poster setter. Plyr stores the poster as its own internal
   * property after construction, so updating `<video poster>` reactively
   * has no visible effect. Callers update the poster via this method.
   * Exposed through `bind:this` on `MediaPlayer`.
   */
  export function setPoster(url: string): void {
    if (!playerInstance || isYouTube) return;
    try {
      playerInstance.poster = url;
    } catch {
      // Plyr may not have finished its setup yet — caller can retry.
    }
  }

  $effect(() => {
    const element = videoElement;
    const nextSrc = src;
    if (!element || isYouTube || !nextSrc || nextSrc === loadedSrc) return;

    loadedSrc = nextSrc;
    playbackFailed = false;
    playbackAuthExpired = false;

    const onLoadedMetadata = () => {
      element.removeEventListener('loadedmetadata', onLoadedMetadata);
      options.onSourceLoaded?.(element);
    };
    element.addEventListener('loadedmetadata', onLoadedMetadata);

    if (hls) {
      void loadHlsSource(element, nextSrc, onLoadedMetadata);
    } else {
      element.src = nextSrc;
      element.load();
    }
  });

  function destroyHlsInstance(): void {
    if (!hlsInstance) return;

    try {
      hlsInstance.destroy();
    } catch {
      // ignore — hls.js may already be torn down
    } finally {
      hlsInstance = null;
    }
  }

  async function loadHlsSource(element: HTMLVideoElement, manifestUrl: string, onLoaded: () => void): Promise<void> {
    const loadGeneration = ++hlsLoadGeneration;
    hlsPlyrGeneration = 0;
    destroyHlsInstance();
    teardownPlyrInstance();
    playbackFailed = false;
    playbackAuthExpired = false;

    if (options.onBeforeHlsLoad) {
      try {
        const result = await options.onBeforeHlsLoad();
        if (result?.authExpired) {
          playbackAuthExpired = true;
          handlePlaybackFailure();

          return;
        }
      } catch (error) {
        // The cookie endpoint may 503 in environments where HLS_SIGNING_SECRET
        // isn't configured (local dev / self-hosted). Playback can still
        // succeed via the API's session-auth streaming route — so we log and
        // proceed rather than fail.
        console.warn('onBeforeHlsLoad failed, continuing without cookie', error);
      }
    }

    // Bail if the source changed underneath us while awaiting the cookie.
    if (loadGeneration !== hlsLoadGeneration || loadedSrc !== manifestUrl) {
      element.removeEventListener('loadedmetadata', onLoaded);
      return;
    }

    // Prefer hls.js over native HLS. Chrome's `canPlayType` returns
    // `'maybe'` for `application/vnd.apple.mpegurl` even though it can't
    // actually play HLS — taking the native path on Chrome makes the
    // `<video>` element fetch the manifest directly with
    // `crossorigin="anonymous"`, which strips cookies and trips the api's
    // 403. Only fall back to native HLS when hls.js isn't supported
    // (real Safari + media-element-only environments).
    const HlsModule = await import('hls.js');
    const Hls = HlsModule.default;
    const FetchLoader = HlsModule.FetchLoader;

    if (loadGeneration !== hlsLoadGeneration || loadedSrc !== manifestUrl) {
      element.removeEventListener('loadedmetadata', onLoaded);
      return;
    }

    if (!Hls.isSupported()) {
      element.src = manifestUrl;
      element.load();
      void constructPlyrForVideoElement();
      return;
    }

    hlsInstance = new Hls({
      enableWorker: true,
      // Defer segment fetches until the user presses play. Manifest/variant
      // playlist discovery still runs so duration metadata is available.
      autoStartLoad: false,
      // Use hls.js's fetch-based loader so we can set `credentials: 'include'`
      // uniformly on the manifest GET, variant playlist GETs, and segment
      // GETs. The default XhrLoader's `xhrSetup` doesn't always fire on
      // every request type (some bypass it for the master playlist),
      // leaving the request without cookies and the api returning 403.
      // FetchLoader respects standard Fetch API credentials.
      loader: FetchLoader,
      fetchSetup: (context, initParams) => {
        initParams.credentials = 'include';
        return new Request(context.url, initParams);
      }
    });
    const hls = hlsInstance;
    const plyrFallbackTimer = setTimeout(() => {
      if (loadGeneration !== hlsLoadGeneration || playerInstance) return;

      void constructPlyrForVideoElement();
    }, 4_000);

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        handlePlaybackFailure();
        if (!playerInstance) {
          void constructPlyrForVideoElement();
        }
      }
    });
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      clearTimeout(plyrFallbackTimer);
      void initHlsPlyr(hls, loadGeneration);
    });

    const startBufferingOnPlay = () => {
      element.removeEventListener('play', startBufferingOnPlay);
      if (loadGeneration !== hlsLoadGeneration || hlsInstance !== hls) return;

      hls.startLoad(-1);
    };
    element.addEventListener('play', startBufferingOnPlay);

    hls.loadSource(manifestUrl);
    hls.attachMedia(element);
  }

  $effect(() => {
    const player = playerInstance;
    const control = options.transcriptPanelControl;
    const template = transcriptButtonElement;
    if (!player || !control || !template) return;

    transcriptPanelCleanup?.();
    transcriptPanelCleanup = attachTranscriptPanelControl(player, template, control);

    return () => {
      transcriptPanelCleanup?.();
      transcriptPanelCleanup = undefined;
    };
  });

  onDestroy(() => {
    isMounted = false;
    youtubeInitGeneration += 1;
    hlsLoadGeneration += 1;
    hlsPlyrGeneration = 0;
    destroyHlsInstance();

    if (playerInstance) {
      try {
        if (playerInstance.isEmbed && playerInstance.playing) {
          playerInstance.pause();
        }
      } catch {
        // No-op for player teardown safety.
      }
    }

    teardownPlyrInstance();

    if (isYouTube && containerElement) {
      containerElement.replaceChildren();
    }
  });
</script>

<svelte:document onvisibilitychange={handleVisibilityChange} />
<svelte:window onblur={handleWindowBlur} />

<div
  class="ui:relative ui:aspect-video ui:w-full ui:overflow-hidden ui:rounded-md"
  style="max-height: {maxHeight}; min-height: {options.minHeight}; height: {options.height};"
>
  {#if isYouTube && youtubeVideoId}
    <div
      bind:this={containerElement}
      class="plyr__video-embed ui:h-full ui:w-full"
      data-plyr-provider="youtube"
      data-plyr-embed-id={youtubeVideoId}
    ></div>
  {:else}
    <!-- svelte-ignore a11y_media_has_caption -->
    <!-- For HLS sources the $effect above assigns src (native HLS) or attaches hls.js; the bare element has no src here. -->
    <!-- `preload="metadata"` keeps the poster visible until the user clicks play. -->
    <!-- `crossorigin` is intentionally omitted: posters live on r2.dev (no CORS), Plyr loads its own `blank.mp4` from cdn.plyr.io (no CORS), and `<track>` works with `blob:` URLs (which the host app fetches via its API client and passes via the `tracks` prop). -->
    <video
      bind:this={videoElement}
      src={hls ? undefined : src}
      {poster}
      {playsinline}
      preload="metadata"
      class="plyr-player ui:h-full ui:w-full ui:object-contain"
    >
      {#each tracks as track (track.src + track.srclang)}
        <track
          kind={track.kind ?? 'captions'}
          src={track.src}
          srclang={track.srclang}
          label={track.label}
          default={track.default ?? false}
        />
      {/each}
    </video>
  {/if}

  {#if !isPlayerReady && !playbackFailed}
    <div
      class="ui:absolute ui:inset-0 ui:z-10 ui:flex ui:items-center ui:justify-center ui:bg-black/40"
      role="status"
      aria-live="polite"
      aria-label={options.loadingLabel}
    >
      <LoaderCircleIcon class="ui:size-10 ui:animate-spin ui:text-white" aria-hidden="true" />
      {#if options.loadingLabel}
        <span class="ui:sr-only">{options.loadingLabel}</span>
      {/if}
    </div>
  {/if}

  {#if playbackFailed && (playbackAuthExpired ? options.playbackAuthErrorLabel : options.playbackErrorLabel)}
    <div
      class="ui:absolute ui:inset-0 ui:z-20 ui:flex ui:flex-col ui:items-center ui:justify-center ui:gap-4 ui:bg-muted/95 ui:px-6 ui:text-center"
      role="alert"
    >
      <p class="ui:text-sm ui:text-muted-foreground">
        {playbackAuthExpired ? options.playbackAuthErrorLabel : options.playbackErrorLabel}
      </p>
      {#if playbackAuthExpired && options.onPlaybackAuthRequired && options.playbackAuthActionLabel}
        <Button variant="outline" onclick={() => options.onPlaybackAuthRequired?.()}>
          {options.playbackAuthActionLabel}
        </Button>
      {:else if !playbackAuthExpired && options.onPlaybackReload && options.playbackReloadLabel}
        <Button variant="outline" disabled={reloadInFlight} onclick={() => void handlePlaybackReloadClick()}>
          {options.playbackReloadLabel}
        </Button>
      {/if}
    </div>
  {/if}

  {#if options.transcriptPanelControl}
    <button
      bind:this={transcriptButtonElement}
      type="button"
      class="plyr__control"
      data-cio-transcript-panel
      aria-label={options.transcriptPanelControl.label}
      hidden
    >
      <CaptionsIcon class="custom" aria-hidden="true" focusable="false" size={18} />
      <span class="plyr__tooltip" role="tooltip">{options.transcriptPanelControl.label}</span>
    </button>
  {/if}
</div>

<style>
  /* Replace Plyr's default black letterbox background. Theme `muted` blends with the
     surrounding lesson area instead of looking like a TV bezel around smaller videos. */
  :global(.plyr) {
    --plyr-video-background: var(--muted);
  }
  :global(.plyr__control[data-cio-transcript-panel][hidden]) {
    display: none !important;
  }
  :global(.plyr__control[data-cio-transcript-panel] svg.custom) {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
  }
</style>
