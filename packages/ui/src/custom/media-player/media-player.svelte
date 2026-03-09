<script lang="ts">
  import type { MediaPlayerOptions, VideoSource } from './types';
  import PlyrPlayer from './players/plyr-player.svelte';
  import MusePlayer from './players/muse-player.svelte';

  interface Props {
    source: VideoSource;
    options?: MediaPlayerOptions;
    class?: string;
  }

  let { source, options = {}, class: className = '' }: Props = $props();

  const isMuse = $derived.by(() => source.type === 'muse' && source.metadata?.svid);
  const poster = $derived(source.type === 'upload' ? source.metadata?.thumbnailUrl : undefined);
</script>

<div class={className}>
  {#if isMuse}
    <MusePlayer svid={source.metadata?.svid} {options} />
  {:else}
    <PlyrPlayer src={source.url} {poster} {options} />
  {/if}
</div>
