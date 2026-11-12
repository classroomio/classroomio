<script lang="ts">
  import ImageIcon from '@lucide/svelte/icons/image';
  import Settings2Icon from '@lucide/svelte/icons/settings-2';
  import { Skeleton } from '../../base/skeleton';
  import { Button } from '../../base/button';
  import { IconButton } from '../icon-button';
  import { cn } from '../../tools';
  import ChangeButton from './block-change-button.svelte';
  import ImageSettingsDialog from './block-image-settings-dialog.svelte';
  import type { ImageBlockFit, ImageBlockSettings } from './types';

  interface Props {
    url?: string;
    alt?: string;
    fit?: ImageBlockFit;
    editable?: boolean;
    uploadLabel?: string;
    changeLabel?: string;
    settingsLabel?: string;
    failedLabel?: string;
    titleLabel?: string;
    altLabel?: string;
    altPlaceholder?: string;
    fitLabel?: string;
    fitCoverLabel?: string;
    fitContainLabel?: string;
    cancelLabel?: string;
    saveLabel?: string;
    onChange?: () => void;
    onSaveSettings?: (settings: ImageBlockSettings) => void;
  }

  let {
    url,
    alt = '',
    fit = 'cover',
    editable = false,
    uploadLabel = 'Upload image',
    changeLabel = 'Change image',
    settingsLabel = 'Image settings',
    failedLabel = 'Image failed to load',
    titleLabel = 'Image settings',
    altLabel = 'Alt text',
    altPlaceholder = 'Describe the image for screen readers',
    fitLabel = 'Fit',
    fitCoverLabel = 'Cover',
    fitContainLabel = 'Contain',
    cancelLabel = 'Cancel',
    saveLabel = 'Save changes',
    onChange,
    onSaveSettings
  }: Props = $props();

  let settingsOpen = $state(false);
  let loadedUrl = $state('');
  let failedUrl = $state('');

  const imageClass = $derived(
    fit === 'cover' ? 'h-full w-full object-cover' : 'ui:bg-muted h-full w-full object-contain'
  );
  const loading = $derived(!!url && loadedUrl !== url && failedUrl !== url);

  function saveSettings(settings: ImageBlockSettings) {
    onSaveSettings?.(settings);
  }
</script>

<div class="ui:group/image ui:relative ui:w-full ui:overflow-hidden ui:rounded-lg">
  {#if url}
    <div class="ui:relative ui:w-full ui:overflow-hidden ui:aspect-video">
      <img
        src={url}
        {alt}
        class={cn(imageClass, loading && 'ui:opacity-0')}
        onload={() => (loadedUrl = url)}
        onerror={() => (failedUrl = url)}
      />
      {#if loading}
        <Skeleton class="ui:absolute ui:inset-0 ui:h-full ui:w-full" />
      {:else if failedUrl === url}
        <div class="ui:bg-muted ui:absolute ui:inset-0 ui:flex ui:items-center ui:justify-center">
          <p class="ui:text-muted-foreground ui:text-sm">{failedLabel}</p>
        </div>
      {/if}
    </div>
  {:else}
    <div class="ui:bg-muted ui:flex ui:w-full ui:flex-col ui:items-center ui:justify-center ui:gap-2 ui:aspect-video">
      <ImageIcon class="ui:text-muted-foreground ui:size-10" />
      {#if editable && onChange}
        <Button variant="outline" size="sm" onclick={onChange}>{uploadLabel}</Button>
      {/if}
    </div>
  {/if}

  {#if editable}
    <div
      class="ui:absolute ui:top-2 ui:right-2 ui:flex ui:items-center ui:gap-1 ui:opacity-100 ui:transition ui:focus-within:opacity-100 ui:sm:opacity-0 ui:sm:group-hover/image:opacity-100"
    >
      {#if onChange}
        <ChangeButton label={changeLabel} onclick={onChange} />
      {/if}
      <IconButton size="icon-sm" onclick={() => (settingsOpen = true)} tooltip={settingsLabel} tooltipSide="left">
        <Settings2Icon size={14} />
      </IconButton>
    </div>
  {/if}
</div>

<ImageSettingsDialog
  bind:open={settingsOpen}
  {alt}
  {fit}
  {titleLabel}
  {altLabel}
  {altPlaceholder}
  {fitLabel}
  {fitCoverLabel}
  {fitContainLabel}
  {cancelLabel}
  {saveLabel}
  onSave={saveSettings}
/>
