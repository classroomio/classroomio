<script lang="ts">
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
    /** Forwarded to Sidebar's powered-by footer. */
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
    showPoweredBy = true,
    courseSlug = null,
    orgSlug = null,
    poweredByLabel = 'Powered by',
    poweredByBrand = 'ClassroomIO'
  }: Props = $props();

  function handleOpenChange(next: boolean) {
    open = next;
    onOpenChange?.(next);
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
      <div class="ui:flex-1 ui:overflow-y-auto ui:px-2 ui:pb-[max(env(safe-area-inset-bottom),1rem)]">
        <Sidebar
          {sections}
          {activeSlug}
          onItemClick={handleItemClick}
          {hrefFor}
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
