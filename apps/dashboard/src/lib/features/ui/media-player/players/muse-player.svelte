<script lang="ts">
  import type { MediaPlayerOptions } from '../types';

  interface Props {
    svid?: string;
    options?: MediaPlayerOptions;
  }

  let { svid }: Props = $props();

  const embedUrl = $derived(
    svid
      ? `https://muse.ai/embed/${svid}?logo=https://app.classroomio.com/logo-512.png&subtitles=auto&cover_play_position=center`
      : ''
  );
</script>

{#if embedUrl}
  <div style="position:relative;padding-bottom:51.416579%">
    <iframe
      src={embedUrl}
      style="width:100%;height:100%;position:absolute;left:0;top:0"
      frameborder="0"
      allowfullscreen
      title="Muse AI Video Embed"
    ></iframe>
  </div>
{/if}
