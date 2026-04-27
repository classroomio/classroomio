<script lang="ts">
  import { resolve } from '$app/paths';
  import pluralize from 'pluralize';
  import { widgetApi } from '../api/widget.svelte';
  import type { WidgetListItem } from '../utils/types';
  import { Button } from '@cio/ui/base/button';
  import * as Item from '@cio/ui/base/item';
  import { Empty } from '@cio/ui/custom/empty';
  import WidgetLayoutThumbnail from '../components/widget-layout-thumbnail.svelte';
  import { cn } from '@cio/ui/tools';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import PanelsTopLeftIcon from '@lucide/svelte/icons/panels-top-left';
  import WidgetCardDropdown from '../components/widget-card-dropdown.svelte';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    initialWidgets?: WidgetListItem[];
    onCreate: () => void | Promise<void>;
  }

  let { initialWidgets = [] as WidgetListItem[], onCreate }: Props = $props();

  $effect(() => {
    widgetApi.widgets = initialWidgets;
  });

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

{#if widgetApi.widgets.length === 0}
  <Empty
    title={$t('widgets.empty.heading')}
    description={$t('widgets.empty.description')}
    icon={PanelsTopLeftIcon}
    variant="page"
  >
    <Button onclick={onCreate}>{$t('widgets.actions.create')}</Button>
  </Empty>
{:else}
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {#each widgetApi.widgets as widget (widget.id)}
      {@const widgetHref = resolve(`/widgets/${widget.id}`, {})}

      <Item.Root variant="outline" class="group ui:bg-card relative overflow-hidden rounded-2xl border p-0!">
        <WidgetCardDropdown id={widget.id} name={widget.name} />
        {#snippet child({ props })}
          <a href={widgetHref} {...props} class={cn('block h-full w-full', props.class as string)}>
            <div class="relative flex h-full w-full flex-col p-3.5">
              <div class="flex items-start justify-between gap-2">
                <div class="flex min-w-0 items-start gap-2.5">
                  <div
                    class="ui:bg-primary/10 ui:text-primary flex size-8 shrink-0 items-center justify-center rounded-lg"
                  >
                    <PanelsTopLeftIcon class="size-4" />
                  </div>

                  <div class="min-w-0">
                    <Item.Title class="ui:w-full text-sm! leading-tight font-semibold">
                      <span class="line-clamp-2">{widget.name}</span>
                    </Item.Title>
                    <Item.Description class="mt-0.5 line-clamp-1! text-xs">
                      {$t(`widgets.layout.${widget.layoutType}`)}
                    </Item.Description>
                  </div>
                </div>

                <span
                  class={cn('mt-1 block size-2 shrink-0 rounded-full', getStatusDotClass(widget.status))}
                  aria-label={widget.status}
                  title={widget.status}
                ></span>
              </div>

              <WidgetLayoutThumbnail
                class="mt-3"
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

              <div class="ui:border-border/60 mt-3 flex items-center justify-end border-t pt-2.5">
                <Button variant="secondary" size="sm" href={widgetHref} class="h-8 gap-1 rounded-full px-3 text-xs">
                  {$t('widgets.actions.edit')}
                  <ArrowUpRightIcon size={14} />
                </Button>
              </div>
            </div>
          </a>
        {/snippet}
      </Item.Root>
    {/each}
  </div>
{/if}
