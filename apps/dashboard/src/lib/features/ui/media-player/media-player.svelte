<script lang="ts">
  import type { VideoSource, MediaPlayerOptions } from './types';
  import PlyrPlayer from './players/plyr-player.svelte';
  import MusePlayer from './players/muse-player.svelte';

  interface Props {
    source: VideoSource;
    options?: MediaPlayerOptions;
    class?: string;
  }

  let { source, options = {}, class: className = '' }: Props = $props();

  // Muse.ai requires iframe, everything else uses Plyr
  const isMuse = $derived.by(() => {
    return source.type === 'muse' && source.metadata?.svid;
  });

  const poster = $derived(source.type === 'upload' ? source.metadata?.thumbnailUrl : undefined);
</script>

<div class="mb-5 {className}">
  {#if isMuse}
    <MusePlayer svid={source.metadata?.svid} {options} />
  {:else}
    <PlyrPlayer src={source.url} {poster} {options} />
  {/if}
</div>
