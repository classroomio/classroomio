<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import 'plyr/dist/plyr.css';
  import CaptionsIcon from '@lucide/svelte/icons/captions';
  import type { MediaPlayerOptions, VideoTextTrack } from '../types';
  import { getYoutubeVideoId, isYoutubeUrl } from '../utils';
  import { PLYR_DEFAULT_CONTROLS } from './constants';
  import type Plyr from 'plyr';

  interface Props {
    src: string;
    poster?: string;
    options?: MediaPlayerOptions;
    tracks?: VideoTextTrack[];
  }

  let { src, poster, options = {}, tracks = [] }: Props = $props();

  let videoElement = $state<HTMLVideoElement | null>(null);
  let containerElement = $state<HTMLDivElement | null>(null);
  let playerInstance = $state<Plyr | null>(null);
  let transcriptButtonElement = $state<HTMLButtonElement | null>(null);
  let timeupdateCleanup: (() => void) | undefined;
  let firstPlayCleanup: (() => void) | undefined;
  let transcriptPanelCleanup: (() => void) | undefined;
  let hasFiredFirstPlay = false;

  const playsinline = $derived(options.playsinline !== false);
  const maxHeight = $derived(options.maxHeight || '400px');
  const showControls = $derived(options.controls !== false);
  const autoplay = $derived(options.autoplay === true);

  const isYouTube = $derived(isYoutubeUrl(src));
  const youtubeVideoId = $derived(isYouTube ? getYoutubeVideoId(src) : null);

  function attachTimeUpdates(player: Plyr): () => void {
    const handler = () => options.onTimeUpdate?.(player.currentTime);
    player.on('timeupdate', handler);
    return () => {
      player.off('timeupdate', handler);
    };
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

  onMount(() => {
    void (async () => {
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
        timeupdateCleanup = attachTimeUpdates(playerInstance);
        firstPlayCleanup = attachFirstPlay(playerInstance);
        options.onPlayerReady?.(playerInstance);
        return;
      }

      if (videoElement) {
        playerInstance = new PlyrConstructor(videoElement, {
          controls,
          autoplay,
          // Native files expose their own width/height — let Plyr fit to them instead of
          // forcing 16:9 and showing black letterbox bars around smaller/portrait videos.
          iconUrl: '/plyr.svg',
          iconPrefix: 'plyr'
        });
        timeupdateCleanup = attachTimeUpdates(playerInstance);
        firstPlayCleanup = attachFirstPlay(playerInstance);
        if (options.transcriptPanelControl && transcriptButtonElement) {
          transcriptPanelCleanup = attachTranscriptPanelControl(
            playerInstance,
            transcriptButtonElement,
            options.transcriptPanelControl
          );
        }
        options.onPlayerReady?.(playerInstance);
      }
    })();
  });

  onDestroy(() => {
    timeupdateCleanup?.();
    firstPlayCleanup?.();
    transcriptPanelCleanup?.();
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
  class="ui:relative ui:aspect-video ui:w-full ui:overflow-hidden ui:bg-muted"
  style="max-height: {maxHeight}; min-height: {options.minHeight}; height: {options.height};"
>
  {#if isYouTube && youtubeVideoId}
    <div
      bind:this={containerElement}
      class="plyr__video-embed ui:absolute ui:inset-0 ui:h-full ui:w-full"
      data-plyr-provider="youtube"
      data-plyr-embed-id={youtubeVideoId}
    ></div>
  {:else}
    <!-- svelte-ignore a11y_media_has_caption -->
    <video
      bind:this={videoElement}
      {src}
      {poster}
      {playsinline}
      class="plyr-player ui:absolute ui:inset-0 ui:h-full ui:w-full ui:object-contain"
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
