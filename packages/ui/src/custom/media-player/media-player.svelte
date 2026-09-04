<script lang="ts">
  import type { MediaPlayerOptions, PlaybackResult, VideoSource } from './types';
  import PlyrPlayer from './players/plyr-player.svelte';
  import MusePlayer from './players/muse-player.svelte';
  import YoutubePlayer from './players/youtube-player.svelte';
  import { getYoutubeVideoId, isYoutubeUrl } from './utils';

  interface Props {
    source: VideoSource;
    options?: MediaPlayerOptions;
    class?: string;
  }

  let { source, options = {}, class: className = '' }: Props = $props();

  let plyrRef: ReturnType<typeof PlyrPlayer> | null = $state(null);
  let youtubeRef: ReturnType<typeof YoutubePlayer> | null = $state(null);

  /**
   * Update the player's poster image after construction. Plyr doesn't
   * react to `<video poster>` attribute changes once it has wrapped the
   * element; callers (e.g. the manage-thumbnails dialog) invoke this on
   * thumbnail selection to refresh the preview.
   */
  export function setPoster(url: string): void {
    plyrRef?.setPoster(url);
  }

  /**
   * Imperative play. Used by autoplay to start the next video when the
   * previous one ends. Works for both Plyr (`<video>`) and YouTube embeds.
   */
  export function play(): void {
    if (isYouTube) {
      youtubeRef?.play();
    } else {
      plyrRef?.play();
    }
  }

  /**
   * Autoplay-aware play. Resolves once playback actually starts (or fails)
   * so the caller can decide whether the user needs a fallback affordance.
   * See {@link PlaybackResult}.
   */
  export function playWhenReady(): Promise<PlaybackResult> {
    if (isYouTube) {
      return youtubeRef?.playWhenReady() ?? Promise.resolve('not-ready');
    }
    return plyrRef?.playWhenReady() ?? Promise.resolve('not-ready');
  }

  const tracks = $derived(source.tracks ?? []);
  const isMuse = $derived.by(() => source.type === 'muse' && source.metadata?.svid);
  const isGoogleDrive = $derived(source.type === 'google_drive');
  const isYouTube = $derived(source.type === 'youtube' || (typeof source.url === 'string' && isYoutubeUrl(source.url)));
  const poster = $derived(source.type === 'upload' ? source.metadata?.thumbnailUrl : undefined);

  const iframeTitle = $derived(source.metadata?.title?.trim() || 'Video');
  const iframeMaxHeight = $derived(options.maxHeight ?? '400px');
  const iframeWidth = $derived(options.width ?? '100%');
  const youtubeVideoId = $derived(isYouTube ? (getYoutubeVideoId(source.url) ?? '') : '');
</script>

<div class={className}>
  {#if isMuse}
    <MusePlayer svid={source.metadata?.svid} {options} />
  {:else if isGoogleDrive}
    <div
      class="ui:relative ui:overflow-hidden ui:rounded-md ui:border ui:border-border"
      style:max-height={iframeMaxHeight}
      style:width={iframeWidth}
    >
      <iframe
        src={source.url}
        title={iframeTitle}
        class="ui:block ui:h-full ui:min-h-[240px] ui:w-full ui:border-0"
        style:aspect-ratio="16 / 9"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>
  {:else if isYouTube}
    <YoutubePlayer bind:this={youtubeRef} videoId={youtubeVideoId} {options} onFirstPlay={options.onFirstPlay} />
  {:else}
    <PlyrPlayer bind:this={plyrRef} src={source.url} {poster} hls={source.hls === true} {options} {tracks} />
  {/if}
</div>
