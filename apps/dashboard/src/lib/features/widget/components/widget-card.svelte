<script lang="ts">
  import { resolve } from '$app/paths';
  import pluralize from 'pluralize';
  import type { WidgetListItem } from '../utils/types';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import * as Item from '@cio/ui/base/item';
  import WidgetLayoutThumbnail from './widget-layout-thumbnail.svelte';
  import WidgetCardDropdown from './widget-card-dropdown.svelte';
  import { cn } from '@cio/ui/tools';
  import ArchiveIcon from '@lucide/svelte/icons/archive';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import PanelsTopLeftIcon from '@lucide/svelte/icons/panels-top-left';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import { widgetApi } from '../api/widget.svelte';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    widget: WidgetListItem;
    mode?: 'active' | 'archived';
    isAdmin?: boolean | null;
  }

  let { widget, mode = 'active', isAdmin = false }: Props = $props();

  const isArchived = $derived(mode === 'archived');
  const widgetHref = $derived(resolve(`/widgets/${widget.id}`, {}));

  function getStatusDotClass(status: string) {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === 'published') {
      return 'bg-emerald-500';
    }

    if (normalizedStatus === 'draft') {
      return 'bg-amber-500';
    }

    return 'ui:bg-muted-foreground/60';
  }
</script>

{#snippet cardContent()}
  <div class="relative flex h-full w-full flex-col p-3.5">
    <div class="flex items-start justify-between gap-2">
      <div class="flex min-w-0 items-start gap-2.5">
        <div
          class={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            isArchived ? 'ui:bg-muted ui:text-muted-foreground' : 'ui:bg-primary/10 ui:text-primary'
          )}
        >
          {#if isArchived}
            <ArchiveIcon class="size-4" />
          {:else}
            <PanelsTopLeftIcon class="size-4" />
          {/if}
        </div>

        <div class="min-w-0">
          <Item.Title class="w-full text-sm! leading-tight font-semibold">
            <span class="line-clamp-2">{widget.name}</span>
          </Item.Title>
          <Item.Description class="mt-0.5 line-clamp-1! text-xs">
            {$t(`widgets.layout.${widget.layoutType}`)}
          </Item.Description>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        {#if isArchived}
          <Badge variant="secondary" class="text-[10px] uppercase">
            {$t('widgets.status.archived')}
          </Badge>
        {:else}
          <span
            class={cn('block size-2 shrink-0 rounded-full', getStatusDotClass(widget.status))}
            aria-label={widget.status}
            title={widget.status}
          ></span>
        {/if}
        <WidgetCardDropdown id={widget.id} name={widget.name} {mode} {isAdmin} />
      </div>
    </div>

    <WidgetLayoutThumbnail
      class={cn('mt-3', isArchived && 'opacity-75')}
      compact
      layoutType={widget.layoutType}
      label={$t(`widgets.layout.${widget.layoutType}`)}
    />

    <div class="ui:text-muted-foreground mt-3 flex items-center justify-between gap-3 text-xs">
      <span class="truncate">{$t(`widgets.selection.${widget.selectionMode}`)}</span>
      <span class="shrink-0">
        {pluralize($t('tags_admin.table.course'), widget.courseCount ?? 0, true)}
      </span>
    </div>

    {#if isArchived && isAdmin}
      <div class="ui:border-border/60 mt-3 flex items-center justify-end border-t pt-2.5">
        <Button
          variant="outline"
          size="sm"
          onclick={() => widgetApi.restoreWidget(widget.id)}
          class="h-8 gap-1.5 rounded-full px-3 text-xs"
        >
          <RotateCcwIcon size={13} />
          {$t('widgets.actions.restore')}
        </Button>
      </div>
    {:else if !isArchived}
      <div class="ui:border-border/60 mt-3 flex items-center justify-end border-t pt-2.5">
        <Button variant="secondary" size="sm" class="h-8 gap-1 rounded-full px-3 text-xs">
          {$t('widgets.actions.edit')}
          <ArrowUpRightIcon size={14} />
        </Button>
      </div>
    {/if}
  </div>
{/snippet}

<Item.Root
  variant="outline"
  class={cn('group ui:bg-card relative overflow-hidden rounded-2xl border p-0', isArchived && 'cursor-default')}
>
  {#snippet child({ props })}
    {@const rootClassName = cn('block h-full w-full', props.class as string)}
    {#if isArchived}
      <div {...props} class={rootClassName}>
        {@render cardContent()}
      </div>
    {:else}
      <a href={widgetHref} {...props} class={rootClassName}>
        {@render cardContent()}
      </a>
    {/if}
  {/snippet}
</Item.Root>
