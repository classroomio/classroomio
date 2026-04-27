<script lang="ts">
  import type { TWidgetLayoutType } from '@cio/utils/validation/widget';
  import { cn } from '@cio/ui/tools';
  import { widgetLayoutThumbnailSrc } from '../utils/layout-thumbnail';

  interface Props {
    layoutType: TWidgetLayoutType;
    label?: string;
    /** Smaller frame for dense lists (e.g. org widgets index). */
    compact?: boolean;
    /** `contain` shows the full image (letterboxed); `cover` fills the frame (may crop). */
    objectFit?: 'cover' | 'contain';
    /** Strong primary border (e.g. layout picker selected state). */
    selected?: boolean;
    class?: string;
  }

  let { layoutType, label, compact = false, objectFit = 'cover', class: className = '' }: Props = $props();

  let imgFailed = $state(false);

  const accent: Record<TWidgetLayoutType, string> = {
    card_grid: 'from-sky-500/15 via-cyan-500/8',
    tag_filter: 'from-orange-500/15 via-amber-500/8',
    carousel: 'from-fuchsia-500/15 via-pink-500/8',
    primary_course: 'from-emerald-500/15 via-lime-500/8',
    compact_list: 'from-violet-500/15 via-purple-500/8',
    editorial_spotlight: 'from-rose-500/15 via-red-500/8',
    category_shelf: 'from-indigo-500/15 via-blue-500/8'
  };

  $effect(() => {
    void layoutType;
    imgFailed = false;
  });
</script>

<div
  class={cn(
    'ui:bg-background/95 relative w-full overflow-hidden rounded-md border',
    compact ? 'aspect-5/3 max-h-28' : 'aspect-4/3',
    className
  )}
>
  <div
    aria-hidden="true"
    class={cn(
      'pointer-events-none absolute inset-x-0 -top-10 h-32 bg-gradient-to-br to-transparent opacity-70 blur-3xl',
      accent[layoutType]
    )}
  ></div>

  {#if !imgFailed}
    <img
      src={widgetLayoutThumbnailSrc(layoutType)}
      alt={label ?? layoutType}
      class={cn(
        'absolute inset-0 h-full w-full transition-transform',
        objectFit === 'contain' ? 'object-contain object-center' : 'object-cover'
      )}
      width={compact ? 480 : 720}
      height={compact ? 288 : 540}
      loading="lazy"
      decoding="async"
      onerror={() => (imgFailed = true)}
    />
  {:else}
    <div class="relative flex h-full w-full items-center justify-center px-3 text-center">
      <span class="ui:text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase">
        {label ?? layoutType.replace('_', ' ')}
      </span>
    </div>
  {/if}
</div>
