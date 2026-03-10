<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import { IconButton } from '../../icon-button';

  let {
    src,
    alt,
    variant = 'preview',
    onRemove,
    disabled = false,
    removeTooltip = '',
    removeSr = 'Remove image',
    hasAnyImageInOptions = false
  }: {
    src: string | null;
    alt: string;
    variant?: 'preview' | 'take' | 'edit';
    onRemove?: () => void;
    disabled?: boolean;
    removeTooltip?: string;
    removeSr?: string;
    hasAnyImageInOptions?: boolean;
  } = $props();

  const sizeClass = $derived(variant === 'edit' ? 'ui:h-24 ui:w-24' : 'ui:h-28 ui:w-28');
  const containerClass = $derived(`${sizeClass} ui:overflow-hidden ui:rounded-md ui:border ui:border-border`);
</script>

{#if variant === 'edit'}
  {#if src}
    <div class="ui:group ui:relative {sizeClass} ui:rounded-md ui:border">
      <div class="ui:absolute ui:inset-0 ui:overflow-hidden ui:rounded-md">
        <img {src} {alt} class="ui:h-full ui:w-full ui:object-cover" />
      </div>
      {#if onRemove}
        <IconButton
          {disabled}
          tooltipClass="ui:absolute ui:right-[-12px] ui:top-[-12px] ui:z-10"
          class="ui:opacity-0 ui:transition-opacity ui:group-hover:opacity-100"
          tooltip={removeTooltip}
          onclick={onRemove}
          size="icon-sm"
        >
          <XIcon />
          <span class="ui:sr-only">{removeSr}</span>
        </IconButton>
      {/if}
    </div>
  {/if}
{:else if hasAnyImageInOptions}
  <div class="{containerClass} {src ? '' : 'ui:bg-muted'}">
    {#if src}
      <img {src} {alt} class="ui:h-full ui:w-full ui:object-cover" />
    {/if}
  </div>
{/if}
