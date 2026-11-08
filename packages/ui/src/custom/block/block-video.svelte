<script lang="ts">
  import type { Snippet } from 'svelte';
  import VideoIcon from '@lucide/svelte/icons/video';
  import { Skeleton } from '../../base/skeleton';
  import { cn } from '../../tools';
  import ChangeButton from './block-change-button.svelte';

  interface Props {
    title: string;
    thumbnailUrl?: string;
    fallbackThumbnailUrl?: string;
    durationLabel?: string;
    channelLine?: string;
    metaLine?: string;
    editable?: boolean;
    changeLabel?: string;
    onChange?: () => void;
    actions?: Snippet;
    status?: Snippet;
    notice?: Snippet;
    player?: Snippet;
    playerKey?: string;
  }

  let {
    title,
    thumbnailUrl,
    fallbackThumbnailUrl,
    durationLabel,
    channelLine,
    metaLine,
    editable = false,
    changeLabel,
    onChange,
    actions,
    status,
    notice,
    player,
    playerKey = ''
  }: Props = $props();

  const PLACEHOLDER_MAX_WIDTH = 120;

  let loadedUrl = $state('');
  let failedUrl = $state('');
  let fallbackFor = $state('');

  const displayedUrl = $derived(
    fallbackThumbnailUrl && thumbnailUrl && fallbackFor === thumbnailUrl ? fallbackThumbnailUrl : thumbnailUrl
  );
  const loadingThumbnail = $derived(!!displayedUrl && loadedUrl !== displayedUrl && failedUrl !== displayedUrl);
  const showThumbnail = $derived(!!displayedUrl && failedUrl !== displayedUrl);

  function switchToFallback(): boolean {
    if (!fallbackThumbnailUrl || !thumbnailUrl || displayedUrl === fallbackThumbnailUrl) return false;

    fallbackFor = thumbnailUrl;
    return true;
  }

  function handleThumbnailLoad(event: Event) {
    const image = event.currentTarget as HTMLImageElement;
    if (image.naturalWidth <= PLACEHOLDER_MAX_WIDTH && switchToFallback()) return;

    loadedUrl = displayedUrl ?? '';
  }

  function handleThumbnailError() {
    if (switchToFallback()) return;

    failedUrl = displayedUrl ?? '';
  }
</script>

{#if player}
  <div class="ui:w-full ui:overflow-hidden ui:rounded-lg">
    {#key playerKey}
      {@render player()}
    {/key}
  </div>
{:else}
  <div class={cn('ui:group ui:w-full ui:max-w-full ui:min-w-0', editable && 'ui:rounded-lg')}>
    <div class="ui:bg-muted ui:relative ui:w-full ui:min-w-0 ui:overflow-hidden ui:rounded-md ui:aspect-video">
      {#if showThumbnail}
        <img
          src={displayedUrl}
          alt={title}
          class={cn(
            'ui:absolute ui:inset-0 ui:block ui:h-full ui:w-full ui:object-cover',
            loadingThumbnail && 'ui:opacity-0'
          )}
          onload={handleThumbnailLoad}
          onerror={handleThumbnailError}
        />
        {#if loadingThumbnail}
          <Skeleton class="ui:absolute ui:inset-0 ui:h-full ui:w-full" />
        {/if}
      {:else}
        <div
          class="ui:flex ui:h-full ui:min-h-0 ui:w-full ui:flex-col ui:items-center ui:justify-center ui:gap-2 ui:px-3 ui:py-4"
          role="img"
          aria-label={title}
        >
          <VideoIcon class="ui:text-muted-foreground ui:size-12 ui:shrink-0" />
          <span class="ui:text-muted-foreground ui:max-w-full ui:text-center ui:text-xs ui:font-medium line-clamp-2">
            {title}
          </span>
        </div>
      {/if}

      {#if durationLabel}
        <div
          class="ui:absolute ui:right-2 ui:bottom-2 ui:rounded ui:bg-black/80 ui:px-1.5 ui:py-0.5 ui:text-xs ui:font-medium ui:text-white"
        >
          {durationLabel}
        </div>
      {/if}

      {#if editable && changeLabel && onChange}
        <ChangeButton
          label={changeLabel}
          onclick={onChange}
          class="ui:absolute ui:top-2 ui:right-2 ui:z-10 ui:opacity-100 ui:transition ui:focus-within:opacity-100 ui:focus-visible:opacity-100 ui:sm:opacity-0 ui:sm:group-hover:opacity-100"
        />
      {/if}
    </div>

    <div class="ui:mt-3 ui:flex ui:min-w-0 ui:gap-3 ui:px-3 ui:py-3">
      <div class="ui:min-w-0 ui:flex-1">
        <div class="ui:flex ui:items-start ui:gap-1">
          <div class="ui:text-foreground ui:min-w-0 ui:flex-1 ui:text-base ui:leading-snug ui:font-semibold">
            <p class="ui:min-w-0 ui:break-words line-clamp-2">{title}</p>
          </div>
          {#if editable && actions}
            {@render actions()}
          {/if}
        </div>

        {#if channelLine}
          <p class="ui:text-muted-foreground ui:mt-0.5 ui:text-sm ui:leading-snug line-clamp-1">{channelLine}</p>
        {/if}

        {#if editable && notice}
          {@render notice()}
        {/if}

        <div class="ui:mt-0.5 ui:flex ui:min-w-0 ui:items-center ui:gap-2">
          {#if metaLine}
            <p class="ui:text-muted-foreground ui:text-sm ui:leading-snug line-clamp-1">{metaLine}</p>
          {/if}
          {#if editable && status}
            {@render status()}
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
