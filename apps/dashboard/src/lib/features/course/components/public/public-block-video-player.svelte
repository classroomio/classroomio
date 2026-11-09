<script lang="ts">
  import { MediaPlayer } from '@cio/ui/custom/media-player';
  import type { PublicLessonViewData } from '@cio/ui/custom/public-course';
  import { t } from '$lib/utils/functions/translations';
  import type { BlockViewModel } from '$features/block/utils/types';

  type PublicVideo = NonNullable<PublicLessonViewData['video']>;

  interface Props {
    block: BlockViewModel<'video'>;
    fallbackTitle: string;
    resolveHlsUrl: (link: string) => string;
    onBeforeHlsLoad: (assetId: string | undefined) => Promise<void>;
  }

  let { block, fallbackTitle, resolveHlsUrl, onBeforeHlsLoad }: Props = $props();

  const video = $derived(block.data as unknown as PublicVideo & { assetId?: string });
  const isHls = $derived(Boolean(video.hls));
  const captionTracks = $derived(
    video.transcript?.vttUrl
      ? [
          {
            kind: 'captions' as const,
            src: video.transcript.vttUrl,
            srclang: video.transcript.language,
            label: t.get('course.navItem.lessons.materials.tabs.video.transcript.captions_label'),
            default: false
          }
        ]
      : []
  );
</script>

<div class="w-full overflow-hidden rounded-lg">
  <MediaPlayer
    source={{
      type: video.type,
      url: isHls ? resolveHlsUrl(video.link) : video.link,
      hls: isHls,
      metadata: { ...(video.metadata ?? {}), title: video.metadata?.title ?? fallbackTitle },
      tracks: captionTracks
    }}
    options={{
      maxHeight: '569px',
      width: '100%',
      controls: true,
      playsinline: true,
      onBeforeHlsLoad: isHls ? () => onBeforeHlsLoad(video.assetId) : undefined,
      playbackErrorLabel: t.get('course.navItem.lessons.materials.tabs.video.playback_error'),
      playbackReloadLabel: t.get('course.navItem.lessons.materials.tabs.video.playback_reload'),
      onPlaybackReload: isHls ? async () => true : undefined
    }}
  />
</div>
