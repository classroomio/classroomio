<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import { Image } from '$features/ui';
  import VideoIcon from '@lucide/svelte/icons/video';
  import { ExternalLinkIcon, HoverableItem } from '@cio/ui/custom/moving-icons';
  import { courseApi } from '$features/course/api';
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
  import { t } from '$lib/utils/functions/translations';

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

  const courseLogoSrc = $derived.by(() => {
    const raw = courseApi.course?.logo;

    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim();
    }

    return null;
  });

  const channelLine = $derived.by(() => {
    const courseTitle = courseApi.course?.title?.trim();

    if (courseTitle) {
      return courseTitle;
    }

    return t.get('course.navItem.lessons.materials.tabs.video.simple_card.course_fallback');
  });

  const sourceKindLabel = $derived.by(() => {
    const key =
      video.type === 'youtube'
        ? 'kind_youtube'
        : video.type === 'upload'
          ? 'kind_upload'
          : video.type === 'google_drive'
            ? 'kind_google_drive'
            : 'kind_generic';

    return t.get(`course.navItem.lessons.materials.tabs.video.simple_card.${key}`);
  });

  const metaLine = $derived.by(() => {
    if (createdAtFormatted) {
      return `${sourceKindLabel} · ${createdAtFormatted}`;
    }

    return sourceKindLabel;
  });
</script>

<!-- YouTube-like: thumbnail on top; avatar + stacked text + overflow menu -->
<div class="group w-full max-w-full min-w-0 {isEditMode ? 'rounded-lg border' : ''}">
  <div class="ui:bg-muted relative aspect-video w-full min-w-0 overflow-hidden rounded-xl">
    {#if thumbnailUrl}
      <Image src={thumbnailUrl} alt={title} className="absolute inset-0 block h-full w-full object-cover" />
    {:else}
      <div
        class="flex h-full min-h-0 w-full flex-col items-center justify-center gap-2 px-3 py-4"
        role="img"
        aria-label={title}
      >
        <VideoIcon class="ui:text-muted-foreground size-12 shrink-0" />
        <span class="ui:text-muted-foreground line-clamp-2 max-w-full text-center text-xs font-medium">
          {title}
        </span>
      </div>
    {/if}

    {#if durationFormatted}
      <div class="absolute right-2 bottom-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
        {durationFormatted}
      </div>
    {/if}
  </div>

  <div class="mt-3 flex min-w-0 gap-3 px-3 py-3">
    <Avatar.Root class="mt-0.5 size-9 shrink-0">
      {#if courseLogoSrc}
        <Avatar.Image src={courseLogoSrc} alt={channelLine} />
      {/if}
      <Avatar.Fallback>
        <VideoIcon class="ui:text-muted-foreground size-4" />
      </Avatar.Fallback>
    </Avatar.Root>

    <div class="min-w-0 flex-1">
      <div class="flex items-start gap-1">
        <div class="ui:text-foreground min-w-0 flex-1 text-base leading-snug font-semibold" {title}>
          {#if isYoutubeWithLink}
            <HoverableItem class="block min-w-0">
              {#snippet children(isHovered)}
                <a
                  href={video.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:ui:underline focus:ui:underline focus:ui:outline-none flex min-w-0 items-start gap-1.5"
                >
                  <span class="line-clamp-2 min-w-0 flex-1 break-words">{title}</span>
                  <ExternalLinkIcon
                    {isHovered}
                    size={14}
                    class="ui:text-muted-foreground mt-0.5 shrink-0"
                    ariaHidden={true}
                  />
                </a>
              {/snippet}
            </HoverableItem>
          {:else}
            <p class="line-clamp-2 min-w-0 break-words">{title}</p>
          {/if}
        </div>
        {#if isEditMode}
          <VideoCardDropdown {video} {onRemove} menuPlacement="inline" />
        {/if}
      </div>
      <p class="ui:text-muted-foreground mt-0.5 line-clamp-1 text-sm leading-snug">
        {channelLine}
      </p>
      <p class="ui:text-muted-foreground mt-0.5 line-clamp-1 text-sm leading-snug">{metaLine}</p>
    </div>
  </div>
</div>
