<script lang="ts">
  import { SLIDE_PLATFORM_BY_ID, type SlideEmbed } from '@cio/utils/functions';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import * as DropdownMenu from '../../base/dropdown-menu';
  import { IconButton } from '../icon-button';
  import { cn } from '../../tools';
  import { SLIDE_PLATFORM_BRAND } from './brand';
  import type { SlideEmbedCardLabels } from './types';

  interface Props {
    slide: SlideEmbed;
    labels: SlideEmbedCardLabels;
    isEditMode?: boolean;
    onRemove?: () => void;
    class?: string;
  }

  let { slide, labels, isEditMode = false, onRemove, class: className = '' }: Props = $props();

  const platform = $derived(SLIDE_PLATFORM_BY_ID[slide.platform]);
  const brand = $derived(SLIDE_PLATFORM_BRAND[slide.platform]);
  const title = $derived(platform?.name ?? 'Slide');
  const hostLabel = $derived.by(() => {
    try {
      return new URL(slide.src).hostname.replace(/^www\./, '');
    } catch {
      return title;
    }
  });
</script>

<div class={cn('ui:group ui:w-full ui:max-w-full ui:min-w-0', isEditMode && 'ui:rounded-lg ui:border', className)}>
  <div class="ui:bg-muted ui:relative ui:aspect-video ui:w-full ui:min-w-0 ui:overflow-hidden ui:rounded-md">
    <div
      class="ui:flex ui:h-full ui:min-h-0 ui:w-full ui:flex-col ui:items-center ui:justify-center ui:gap-2 ui:px-3 ui:py-4"
      role="img"
      aria-label={title}
    >
      <span
        class="ui:flex ui:size-12 ui:items-center ui:justify-center ui:rounded-md ui:text-lg ui:font-semibold ui:text-white"
        style:background={brand.color}
        aria-hidden="true"
      >
        {brand.glyph}
      </span>
      <span class="ui:text-muted-foreground ui:line-clamp-2 ui:max-w-full ui:text-center ui:text-xs ui:font-medium">
        {title}
      </span>
    </div>
  </div>

  <div class="ui:mt-3 ui:flex ui:min-w-0 ui:gap-3 ui:px-3 ui:py-3">
    <div class="ui:min-w-0 ui:flex-1">
      <div class="ui:flex ui:items-start ui:gap-1">
        <p
          class="ui:text-foreground ui:line-clamp-2 ui:min-w-0 ui:flex-1 ui:text-base ui:leading-snug ui:font-semibold ui:break-words"
          {title}
        >
          {title}
        </p>
        {#if isEditMode && onRemove}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              class="ui:-mt-0.5 ui:-mr-1 ui:flex ui:shrink-0 ui:items-center ui:justify-center"
              aria-label={labels.menuAria}
              onclick={(event) => event.stopPropagation()}
            >
              <IconButton variant="ghost">
                <EllipsisVerticalIcon size={16} />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item class="ui:text-red-600" onclick={onRemove}>
                <span class="ui:flex ui:items-center ui:gap-2">
                  <Trash2Icon size={14} />
                  {labels.remove}
                </span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        {/if}
      </div>
      <p class="ui:text-muted-foreground ui:mt-0.5 ui:line-clamp-1 ui:text-sm ui:leading-snug">{hostLabel}</p>
    </div>
  </div>
</div>
