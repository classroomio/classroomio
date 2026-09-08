<script lang="ts">
  import type { Snippet } from 'svelte';
  import { mergeProps } from 'bits-ui';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import * as Collapsible from '../../base/collapsible';
  import * as Tooltip from '../../base/tooltip';
  import { cn } from '../../tools';
  import PoweredBy from './powered-by.svelte';
  import SidebarRow from './sidebar-row.svelte';
  import type { PublicCourseSidebarItem, PublicCourseSidebarSection } from './types';

  interface Props {
    sections: PublicCourseSidebarSection[];
    /** Slug of the active item. Matches against `item.slug`. */
    activeSlug?: string | null;
    onItemClick?: (item: PublicCourseSidebarItem) => void;
    hrefFor?: (item: PublicCourseSidebarItem) => string;
    /** When true, sections collapse/expand; only `collapseToSectionId` stays open on reset. */
    collapsibleSections?: boolean;
    /** When set, collapses all sections except this one (e.g. on mobile sheet open). */
    collapseToSectionId?: string | null;
    /** Increment to force collapse reset even when `collapseToSectionId` is unchanged. */
    collapseResetKey?: number;
    showPoweredBy?: boolean;
    courseSlug?: string | null;
    orgSlug?: string | null;
    poweredByLabel?: string;
    poweredByBrand?: string;
    class?: string;
  }

  let {
    sections,
    activeSlug = null,
    onItemClick,
    hrefFor,
    collapsibleSections = false,
    collapseToSectionId = null,
    collapseResetKey = 0,
    showPoweredBy = true,
    courseSlug = null,
    orgSlug = null,
    poweredByLabel = 'Powered by',
    poweredByBrand = 'ClassroomIO',
    class: className
  }: Props = $props();

  let expandedSectionIds = $state<Set<string>>(new Set());
  let trackedCollapseSignature = $state<string | null>(null);

  $effect(() => {
    if (!collapsibleSections || !collapseToSectionId) {
      return;
    }

    const collapseSignature = `${collapseToSectionId}:${collapseResetKey}`;
    if (collapseSignature === trackedCollapseSignature) {
      return;
    }

    trackedCollapseSignature = collapseSignature;
    expandedSectionIds = new Set([collapseToSectionId]);
  });

  function isSectionOpen(sectionId: string): boolean {
    if (!collapsibleSections) {
      return true;
    }

    return expandedSectionIds.has(sectionId);
  }

  function handleSectionOpenChange(sectionId: string, open: boolean) {
    if (!collapsibleSections) {
      return;
    }

    const next = new Set(expandedSectionIds);
    if (open) {
      next.add(sectionId);
    } else {
      next.delete(sectionId);
    }
    expandedSectionIds = next;
  }
</script>

{#snippet sectionItems(section: PublicCourseSidebarSection)}
  {#each section.items as item, index (item.id)}
    <SidebarRow
      number={index + 1}
      title={item.title}
      active={item.slug === activeSlug}
      locked={!item.isUnlocked}
      itemSlug={item.slug}
      href={hrefFor?.(item)}
      onClick={() => onItemClick?.(item)}
    />
  {/each}
{/snippet}

<div class={cn('ui:flex ui:h-full ui:flex-col ui:bg-sidebar', className)}>
  <nav class="ui:flex ui:flex-1 ui:flex-col ui:gap-6 ui:py-6 ui:px-2" aria-label="Course outline">
    <Tooltip.Provider delayDuration={300}>
      {#each sections as section (section.id)}
        {#if collapsibleSections}
          <Collapsible.Root
            open={isSectionOpen(section.id)}
            onOpenChange={(open) => handleSectionOpenChange(section.id, open)}
            class="ui:group/section ui:flex ui:min-w-0 ui:flex-col ui:gap-1"
          >
            <Collapsible.Trigger
              class="ui:flex ui:w-full ui:items-center ui:justify-between ui:gap-2 ui:rounded-sm ui:px-3 ui:py-1.5 ui:text-left"
            >
              <span class="ui:flex ui:min-w-0 ui:items-center ui:gap-1.5">
                <ChevronRightIcon
                  class="ui:size-3.5 ui:shrink-0 ui:text-muted-foreground ui:transition-transform ui:group-data-[state=open]/section:rotate-90"
                />
                <span class="ui:truncate ui:font-medium ui:uppercase ui:text-[11px] ui:text-muted-foreground">
                  {section.title}
                </span>
              </span>
            </Collapsible.Trigger>
            <Collapsible.Content class="ui:flex ui:flex-col">
              {@render sectionItems(section)}
            </Collapsible.Content>
          </Collapsible.Root>
        {:else}
          <div class="ui:flex ui:min-w-0 ui:flex-col ui:gap-2">
            <h2 class="ui:m-0 ui:min-w-0 ui:w-full">
              <Tooltip.Root>
                <Tooltip.Trigger>
                  {#snippet child({ props })}
                    <span
                      {...mergeProps(
                        {
                          class: cn(
                            'ui:block ui:w-full ui:min-w-0 ui:truncate ui:px-3 ui:font-medium ui:uppercase ui:text-[11px] ui:text-muted-foreground ui:transition-colors'
                          )
                        },
                        props
                      )}
                    >
                      {section.title}
                    </span>
                  {/snippet}
                </Tooltip.Trigger>
                <Tooltip.Content side="top" sideOffset={6} class="ui:max-w-xs">
                  {section.title}
                </Tooltip.Content>
              </Tooltip.Root>
            </h2>
            <div class="ui:flex ui:flex-col">
              {@render sectionItems(section)}
            </div>
          </div>
        {/if}
      {/each}
    </Tooltip.Provider>
  </nav>

  {#if showPoweredBy}
    <PoweredBy {courseSlug} {orgSlug} label={poweredByLabel} brand={poweredByBrand} />
  {/if}
</div>
