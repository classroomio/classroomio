<script lang="ts">
  import type { MediaPlayerOptions, VideoSource } from './types';
  import PlyrPlayer from './players/plyr-player.svelte';
  import MusePlayer from './players/muse-player.svelte';
  import { formatYoutubeEmbedUrl } from './utils';

  interface Props {
    source: VideoSource;
    options?: MediaPlayerOptions;
    class?: string;
  }

  let { source, options = {}, class: className = '' }: Props = $props();

  let plyrRef: ReturnType<typeof PlyrPlayer> | null = $state(null);

  /**
   * Update the player's poster image after construction. Plyr doesn't
   * react to `<video poster>` attribute changes once it has wrapped the
   * element; callers (e.g. the manage-thumbnails dialog) invoke this on
   * thumbnail selection to refresh the preview.
   */
  export function setPoster(url: string): void {
    plyrRef?.setPoster(url);
  }

  const tracks = $derived(source.tracks ?? []);
  const isMuse = $derived.by(() => source.type === 'muse' && source.metadata?.svid);
  const isGoogleDrive = $derived(source.type === 'google_drive');
  const isYouTube = $derived(source.type === 'youtube');
  const poster = $derived(source.type === 'upload' ? source.metadata?.thumbnailUrl : undefined);

  const iframeTitle = $derived(source.metadata?.title?.trim() || 'Video');
  const iframeMaxHeight = $derived(options.maxHeight ?? '400px');
  const iframeWidth = $derived(options.width ?? '100%');
  const youtubeEmbedUrl = $derived(isYouTube ? formatYoutubeEmbedUrl(source.url) : '');
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
    <!-- Native embed avoids Plyr's async noembed/setAspectRatio race on teardown. -->
    <div
      class="ui:relative ui:aspect-video ui:w-full ui:overflow-hidden ui:rounded-md"
      style:max-height={iframeMaxHeight}
      style:width={iframeWidth}
      style:min-height={options.minHeight}
      style:height={options.height}
    >
      <iframe
        src={youtubeEmbedUrl}
        title={iframeTitle}
        class="ui:block ui:h-full ui:w-full ui:border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    </div>
  {:else}
    <PlyrPlayer bind:this={plyrRef} src={source.url} {poster} hls={source.hls === true} {options} {tracks} />
  {/if}
</div>
