<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as Drawer from '../../base/drawer';
  import Sidebar from './sidebar.svelte';
  import type { PublicCourseSidebarItem, PublicCourseSidebarSection } from './types';

  interface Props {
    open: boolean;
    onOpenChange?: (next: boolean) => void;
    sections: PublicCourseSidebarSection[];
    activeSlug?: string | null;
    onItemClick?: (item: PublicCourseSidebarItem) => void;
    hrefFor?: (item: PublicCourseSidebarItem) => string;
    title?: string;
    /** Optional progress card rendered between header and scrollable outline. */
    progress?: Snippet;
    /** When set, collapses all sections except this one when the sheet opens. */
    collapseToSectionId?: string | null;
    showPoweredBy?: boolean;
    courseSlug?: string | null;
    orgSlug?: string | null;
    poweredByLabel?: string;
    poweredByBrand?: string;
  }

  let {
    open = $bindable(false),
    onOpenChange,
    sections,
    activeSlug = null,
    onItemClick,
    hrefFor,
    title = 'Course outline',
    progress,
    collapseToSectionId = null,
    showPoweredBy = true,
    courseSlug = null,
    orgSlug = null,
    poweredByLabel = 'Powered by',
    poweredByBrand = 'ClassroomIO'
  }: Props = $props();

  let scrollContainer = $state<HTMLDivElement | null>(null);

  function scrollToActiveItem() {
    if (!scrollContainer || !activeSlug) {
      return;
    }

    requestAnimationFrame(() => {
      const activeRow = scrollContainer?.querySelector(`[data-item-slug="${activeSlug}"]`);
      if (activeRow instanceof HTMLElement) {
        activeRow.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
  }

  function handleOpenChange(next: boolean) {
    open = next;
    onOpenChange?.(next);

    if (next) {
      scrollToActiveItem();
    }
  }

  function handleItemClick(item: PublicCourseSidebarItem) {
    onItemClick?.(item);
    handleOpenChange(false);
  }
</script>

<Drawer.Root {open} onOpenChange={handleOpenChange}>
  <Drawer.Portal>
    <Drawer.Overlay class="ui:fixed ui:inset-0 ui:z-50 ui:bg-black/40" />
    <Drawer.Content
      class="ui:fixed ui:inset-x-0 ui:bottom-0 ui:z-50 ui:flex ui:max-h-[85vh] ui:flex-col ui:rounded-t-xl ui:border-t ui:border-border ui:bg-background"
    >
      <div class="ui:mx-auto ui:mt-2 ui:h-1 ui:w-10 ui:rounded-full ui:bg-muted" aria-hidden="true"></div>
      <Drawer.Header class="ui:px-5 ui:pt-3 ui:pb-2">
        <Drawer.Title class="ui:text-sm ui:font-semibold ui:text-foreground">{title}</Drawer.Title>
      </Drawer.Header>
      {#if progress}
        <div class="ui:shrink-0 ui:px-3 ui:pb-2">
          {@render progress()}
        </div>
      {/if}
      <div
        bind:this={scrollContainer}
        class="ui:flex-1 ui:overflow-y-auto ui:px-2 ui:pb-[max(env(safe-area-inset-bottom),1rem)]"
      >
        <Sidebar
          {sections}
          {activeSlug}
          onItemClick={handleItemClick}
          {hrefFor}
          collapsibleSections={Boolean(collapseToSectionId)}
          {collapseToSectionId}
          {showPoweredBy}
          {courseSlug}
          {orgSlug}
          {poweredByLabel}
          {poweredByBrand}
        />
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
