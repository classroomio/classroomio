<script lang="ts">
  import * as Item from '@cio/ui/base/item';
  import { Image } from '$features/ui';
  import VideoIcon from '@lucide/svelte/icons/video';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import VideoCardDropdown from './video-card-dropdown.svelte';
  import {
    getVideoThumbnailUrl,
    getVideoTitle,
    getVideoDurationSeconds,
    formatVideoDuration,
    getVideoCreatedAt,
    formatVideoCreatedAt,
    type LessonVideo
  } from './video-card-utils';

  interface Props {
    video: LessonVideo;
    index: number;
    isEditMode: boolean;
    onRemove: () => void;
  }

  let { video, index, isEditMode, onRemove }: Props = $props();

  const thumbnailUrl = $derived(getVideoThumbnailUrl(video));
  const title = $derived(getVideoTitle(video, index));
  const durationSeconds = $derived(getVideoDurationSeconds(video));
  const durationFormatted = $derived(formatVideoDuration(durationSeconds ?? undefined));
  const createdAtIso = $derived(getVideoCreatedAt(video));
  const createdAtFormatted = $derived(formatVideoCreatedAt(createdAtIso ?? undefined));

  const isYoutubeWithLink = $derived(video.type === 'youtube' && !!video.link);
</script>

<Item.Root variant="outline" class="group relative max-w-[320px] cursor-default! p-3!">
  <div class="flex flex-col">
    {#if isEditMode}
      <VideoCardDropdown {onRemove} />
    {/if}

    <Item.Header>
      <Item.Media variant="image" class="relative h-50! w-full! overflow-hidden rounded-sm">
        {#if thumbnailUrl}
          <Image src={thumbnailUrl} alt={title} className="h-full w-full object-cover" />
        {:else}
          <div
            class="ui:bg-muted flex h-full w-full flex-col items-center justify-center gap-2 px-3 py-4"
            role="img"
            aria-label={title}
          >
            <VideoIcon class="ui:text-muted-foreground size-10 shrink-0" />
            <span class="ui:text-muted-foreground line-clamp-2 max-w-full text-center text-xs font-medium">
              {title}
            </span>
          </div>
        {/if}

        {#if durationFormatted}
          <div class="absolute right-2 bottom-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            {durationFormatted}
          </div>
        {/if}
      </Item.Media>
    </Item.Header>

    <Item.Content>
      <Item.Title class="line-clamp-2 min-h-[44px] text-base!" {title}>
        {#if isYoutubeWithLink}
          <a
            href={video.link}
            target="_blank"
            rel="noopener noreferrer"
            class="ui:text-foreground hover:ui:underline focus:ui:underline focus:ui:outline-none inline-flex items-center gap-1.5"
          >
            <span class="line-clamp-2">{title}</span>
            <ExternalLinkIcon class="ui:text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
          </a>
        {:else}
          {title}
        {/if}
      </Item.Title>
      <p class="ui:text-muted-foreground mt-1 text-xs">
        {#if createdAtFormatted && durationFormatted}
          {createdAtFormatted} · {durationFormatted}
        {:else if createdAtFormatted}
          {createdAtFormatted}
        {:else if durationFormatted}
          {durationFormatted}
        {:else}
          –
        {/if}
      </p>
    </Item.Content>
  </div>
</Item.Root>
