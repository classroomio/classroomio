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
  <div class="ui:relative ui:overflow-hidden ui:rounded-md" style="padding-bottom:51.416579%">
    <iframe
      src={embedUrl}
      class="ui:absolute ui:left-0 ui:top-0 ui:h-full ui:w-full"
      frameborder="0"
      allowfullscreen
      title="Muse AI Video"
    ></iframe>
  </div>
{/if}
