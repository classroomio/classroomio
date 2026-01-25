<script lang="ts">
  import 'vidstack/bundle';
  import type { MediaPlayerOptions } from '../types';

  interface Props {
    src: string;
    options?: MediaPlayerOptions;
  }

  let { src, options = {} }: Props = $props();

  const playsinline = $derived(options.playsinline !== false);
  // const controls = $derived(options.controls !== false);
  const maxHeight = $derived(options.maxHeight || '569px');
</script>

<media-player {src} crossorigin {playsinline} controls={false} style="--video-max-height: {maxHeight};">
  <media-provider />
  <media-video-layout />
</media-player>
