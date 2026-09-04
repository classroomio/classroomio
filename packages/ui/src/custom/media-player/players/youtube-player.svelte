<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import RepeatIcon from '@lucide/svelte/icons/repeat';
  import type { MediaPlayerOptions, PlaybackResult } from '../types';

  /**
   * Minimal typings for the subset of the YouTube IFrame API used here.
   * `@types/youtube` is intentionally not a dependency — we only need the
   * player construction and the few events/properties we subscribe to.
   */
  interface YoutubePlayerInstance {
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    destroy(): void;
  }

  interface YoutubeEvent {
    data?: number;
  }

  interface YoutubePlayerOptionsConfig {
    videoId: string;
    playerVars?: Record<string, string | number | boolean | undefined>;
    events?: {
      onReady?: () => void;
      onStateChange?: (event: YoutubeEvent) => void;
      onError?: (event: YoutubeEvent) => void;
    };
  }

  interface YoutubePlayerConstructor {
    new (element: HTMLDivElement, options: YoutubePlayerOptionsConfig): YoutubePlayerInstance;
  }

  interface YoutubeGlobal {
    Player: YoutubePlayerConstructor;
    PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number; UNSTARTED: number };
    ready?: boolean;
  }

  type YoutubeWindow = Window & {
    YT?: YoutubeGlobal;
    onYouTubeIframeAPIReady?: () => void;
  };

  interface Props {
    videoId: string;
    options?: MediaPlayerOptions;
    /** Fired the first time playback transitions to playing in this player session. */
    onFirstPlay?: () => void;
  }

  let { videoId, options = {}, onFirstPlay }: Props = $props();

  let containerElement = $state<HTMLDivElement | null>(null);
  let isPlayerReady = $state(false);
  let apiLoadError = $state(false);
  let ytPlayer: YoutubePlayerInstance | null = null;
  let timePollTimer: ReturnType<typeof setInterval> | null = null;
  let hasFiredFirstPlay = false;
  let isMounted = false;
  let lastReportedSeconds = 0;
  let shouldPlayOnReady = false;
  let isPlaying = $state(false);
  let playWhenReadyResolvers: Array<(result: PlaybackResult) => void> = [];

  const autoplayToggleLabel = $derived(options.autoplayToggleLabel);
  const autoplayEnabled = $derived(options.autoplayEnabled ?? true);
  const onAutoplayToggle = $derived(options.onAutoplayToggle);

  let apiLoadPromise: Promise<YoutubeGlobal> | null = null;

  function ytWindow(): YoutubeWindow {
    return window as unknown as YoutubeWindow;
  }

  function loadYoutubeApi(): Promise<YoutubeGlobal> {
    if (apiLoadPromise) return apiLoadPromise;

    apiLoadPromise = new Promise<YoutubeGlobal>((resolvePromise, rejectPromise) => {
      if (typeof window === 'undefined') {
        rejectPromise(new Error('YouTube API is browser-only'));
        return;
      }

      const win = ytWindow();

      if (win.YT?.ready) {
        resolvePromise(win.YT);
        return;
      }

      win.onYouTubeIframeAPIReady = () => {
        if (win.YT) {
          resolvePromise(win.YT);
        } else {
          rejectPromise(new Error('YouTube API loaded without YT global'));
        }
      };

      const existing = document.querySelector<HTMLScriptElement>('script[src^="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        tag.onerror = () => rejectPromise(new Error('Failed to load YouTube IFrame API'));
        document.head.appendChild(tag);
      }
    });

    return apiLoadPromise;
  }

  function startTimePolling(): void {
    if (timePollTimer !== null) return;

    timePollTimer = setInterval(() => {
      if (!ytPlayer) return;

      const seconds = ytPlayer.getCurrentTime();
      if (Math.abs(seconds - lastReportedSeconds) >= 0.25) {
        lastReportedSeconds = seconds;
        options.onTimeUpdate?.(seconds);
      }
    }, 250);
  }

  function stopTimePolling(): void {
    if (timePollTimer !== null) {
      clearInterval(timePollTimer);
      timePollTimer = null;
    }
  }

  function teardownPlayer(): void {
    isMounted = false;
    stopTimePolling();
    try {
      ytPlayer?.destroy();
    } catch {
      // Player may have already been torn down.
    }
    ytPlayer = null;
    isPlayerReady = false;
    shouldPlayOnReady = false;
  }

  onMount(() => {
    isMounted = true;

    void (async () => {
      try {
        const YT = await loadYoutubeApi();
        if (!isMounted || !containerElement) return;

        ytPlayer = new YT.Player(containerElement, {
          videoId,
          playerVars: {
            enablejsapi: 1,
            autoplay: 0,
            rel: 0,
            controls: 1,
            playsinline: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined
          },
          events: {
            onReady: () => {
              isPlayerReady = true;

              const iframe =
                containerElement?.querySelector('iframe') ?? (containerElement as unknown as HTMLIFrameElement);
              if (iframe && typeof iframe.setAttribute === 'function') {
                iframe.setAttribute(
                  'allow',
                  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                );
                iframe.setAttribute('allowfullscreen', 'true');
              }

              if (shouldPlayOnReady) {
                shouldPlayOnReady = false;
                try {
                  ytPlayer?.playVideo();
                } catch {
                  // Fallback
                }
              }

              // Surface a seek-and-play handle compatible with how callers
              // consume Plyr's `player.currentTime` setter.
              options.onPlayerReady?.({
                set currentTime(seconds: number) {
                  ytPlayer?.seekTo(seconds, true);
                },
                get currentTime() {
                  return ytPlayer?.getCurrentTime() ?? 0;
                }
              } as unknown as Parameters<NonNullable<MediaPlayerOptions['onPlayerReady']>>[0]);
            },
            onStateChange: (event) => {
              const state = event.data;
              if (state === YT.PlayerState.PLAYING) {
                isPlaying = true;
                const resolvers = playWhenReadyResolvers.splice(0, playWhenReadyResolvers.length);
                resolvers.forEach((resolveResult) => resolveResult('played'));

                if (!hasFiredFirstPlay) {
                  hasFiredFirstPlay = true;
                  onFirstPlay?.();
                }
                startTimePolling();
              } else if (state === YT.PlayerState.ENDED || state === 0) {
                isPlaying = false;
                stopTimePolling();
                options.onEnded?.();
              } else {
                isPlaying = false;
                stopTimePolling();
              }
            },
            onError: () => {
              stopTimePolling();
              apiLoadError = true;
            }
          }
        });
      } catch {
        if (isMounted) {
          apiLoadError = true;
        }
      }
    })();

    return teardownPlayer;
  });

  $effect(() => {
    const id = videoId;
    if (ytPlayer && isPlayerReady && id) {
      try {
        (ytPlayer as any).cueVideoById?.(id);
      } catch {
        // Ignored
      }
    }
  });

  onDestroy(teardownPlayer);

  function handleAutoplayToggleClick(): void {
    onAutoplayToggle?.();
  }

  export function play(): void {
    if (isPlayerReady && ytPlayer) {
      ytPlayer.playVideo();
    } else {
      shouldPlayOnReady = true;
    }
  }

  /**
   * Imperative play that resolves once YouTube playback actually starts (or
   * fails). Used by autoplay's decision engine. Falls back to the same
   * `shouldPlayOnReady` mechanism as `play()` when the player isn't built
   * yet, resolving when the onStateChange `PLAYING` event fires.
   */
  export function playWhenReady(): Promise<PlaybackResult> {
    return new Promise<PlaybackResult>((resolveResult) => {
      if (isPlaying) {
        resolveResult('played');
        return;
      }

      playWhenReadyResolvers.push(resolveResult);

      const timeout = setTimeout(() => {
        const idx = playWhenReadyResolvers.indexOf(resolveResult);
        if (idx >= 0) playWhenReadyResolvers.splice(idx, 1);
        resolveResult('not-ready');
      }, 2500);

      if (isPlayerReady && ytPlayer) {
        ytPlayer.playVideo();
      } else {
        shouldPlayOnReady = true;
      }
    });
  }

  export function pause(): void {
    shouldPlayOnReady = false;
    ytPlayer?.pauseVideo();
  }
</script>

<div
  class="ui:relative ui:aspect-video ui:w-full ui:overflow-hidden ui:rounded-md"
  style="max-height: {options.maxHeight}; min-height: {options.minHeight}; height: {options.height}; width: {options.width};"
>
  <div bind:this={containerElement} class="ui:h-full ui:w-full"></div>

  {#if onAutoplayToggle}
    <button
      type="button"
      class="ui:absolute ui:right-3 ui:top-3 ui:z-10 ui:inline-flex ui:h-9 ui:w-9 ui:items-center ui:justify-center ui:rounded-full ui:border ui:border-border ui:bg-background/80 ui:shadow-sm ui:backdrop-blur ui:transition-colors ui:hover:bg-background"
      data-cio-youtube-autoplay-toggle
      class:is-active={autoplayEnabled}
      aria-label={autoplayToggleLabel}
      title={autoplayToggleLabel}
      aria-pressed={autoplayEnabled}
      onclick={handleAutoplayToggleClick}
    >
      <RepeatIcon class="ui:size-4" aria-hidden="true" focusable="false" />
    </button>
  {/if}

  {#if apiLoadError}
    <div
      class="ui:absolute ui:inset-0 ui:z-20 ui:flex ui:items-center ui:justify-center ui:bg-muted/95 ui:px-6 ui:text-center"
      role="alert"
    >
      <p class="ui:text-sm ui:text-muted-foreground">{options.playbackErrorLabel}</p>
    </div>
  {/if}
</div>

<style>
  :global([data-cio-youtube-autoplay-toggle].is-active svg) {
    color: var(--primary);
  }
</style>
