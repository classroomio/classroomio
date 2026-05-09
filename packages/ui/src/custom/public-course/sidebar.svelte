<script lang="ts">
  import { cn } from '../../tools';
  import PoweredBy from './powered-by.svelte';
  import SidebarRow from './sidebar-row.svelte';
  import type { PublicCourseSidebarItem, PublicCourseSidebarSection } from './types';

  interface Props {
    sections: PublicCourseSidebarSection[];
    /** Slug of the active item. Matches against `item.slug`. */
    activeSlug?: string | null;
    /** Receives the target item on click; components using `hrefFor` should also provide this. */
    onItemClick?: (item: PublicCourseSidebarItem) => void;
    /** Builds the `href` for a given item. Omit to render rows as buttons. */
    hrefFor?: (item: PublicCourseSidebarItem) => string;
    /**
     * Show the "Powered by ClassroomIO" footer pinned to the bottom of the sidebar.
     * Defaults to `true` when paired with `courseSlug` / `orgSlug`.
     */
    showPoweredBy?: boolean;
    /** Course slug used in the powered-by attribution link. */
    courseSlug?: string | null;
    /** Org slug used in the powered-by attribution link. */
    orgSlug?: string | null;
    /** Localized labels for the powered-by footer. */
    poweredByLabel?: string;
    poweredByBrand?: string;
    class?: string;
  }

  let {
    sections,
    activeSlug = null,
    onItemClick,
    hrefFor,
    showPoweredBy = true,
    courseSlug = null,
    orgSlug = null,
    poweredByLabel = 'Powered by',
    poweredByBrand = 'ClassroomIO',
    class: className
  }: Props = $props();
</script>

<div class={cn('ui:flex ui:h-full ui:flex-col ui:bg-sidebar', className)}>
  <nav class="ui:flex ui:flex-1 ui:flex-col ui:gap-6 ui:py-6 ui:px-2" aria-label="Course outline">
    {#each sections as section (section.id)}
      <div class="ui:flex ui:flex-col ui:gap-2">
        <h2
          class="ui:px-3 ui:text-xs ui:font-medium ui:uppercase ui:text-[11px] ui:text-muted-foreground ui:tracking-wider ui:transition-colors ui:whitespace-nowrap"
        >
          {section.title}
        </h2>
        <div class="ui:flex ui:flex-col">
          {#each section.items as item, index (item.id)}
            <SidebarRow
              number={index + 1}
              title={item.title}
              active={item.slug === activeSlug}
              locked={!item.isUnlocked}
              href={hrefFor?.(item)}
              onClick={() => onItemClick?.(item)}
            />
          {/each}
        </div>
      </div>
    {/each}
  </nav>

  {#if showPoweredBy}
    <PoweredBy {courseSlug} {orgSlug} label={poweredByLabel} brand={poweredByBrand} />
  {/if}
</div>
