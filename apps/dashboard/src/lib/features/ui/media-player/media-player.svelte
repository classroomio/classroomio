<script lang="ts">
  import type { VideoSource, MediaPlayerOptions } from './types';
  import VidstackPlayer from './players/vidstack-player.svelte';
  import MusePlayer from './players/muse-player.svelte';

  interface Props {
    source: VideoSource;
    options?: MediaPlayerOptions;
    class?: string;
  }

  let { source, options = {}, class: className = '' }: Props = $props();

  // Muse.ai requires iframe, everything else uses Vidstack
  const isMuse = $derived.by(() => {
    return source.type === 'muse' && source.metadata?.svid;
  });
</script>

<div class="mb-5 {className}">
  {#if isMuse}
    <MusePlayer svid={source.metadata?.svid} {options} />
  {:else}
    <VidstackPlayer src={source.url} {options} />
  {/if}
</div>
