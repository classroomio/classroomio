<script lang="ts">
  import * as Drawer from '@cio/ui/base/drawer';
  import CourseProgressCard from '$features/course/components/course-progress-card.svelte';
  import { courseApi } from '$features/course/api';
  import { getCourseProgress } from '$features/course/utils/content';
  import { scrollOutlineToActiveItem } from '$features/course/utils/content-navigation';
  import { t } from '$lib/utils/functions/translations';
  import CourseMobileOutlineTree from './course-mobile-outline-tree.svelte';

  interface Props {
    open: boolean;
    onOpenChange?: (next: boolean) => void;
    path: string;
    courseId: string;
  }

  let { open = $bindable(false), onOpenChange, path, courseId }: Props = $props();

  let scrollContainer = $state<HTMLDivElement | null>(null);
  let outlineTree = $state<CourseMobileOutlineTree | null>(null);

  const courseProgress = $derived(getCourseProgress(courseApi.course));

  function handleOpenChange(next: boolean) {
    open = next;
    onOpenChange?.(next);

    if (!next) {
      return;
    }

    outlineTree?.collapseToActiveSection();

    const activeItemId = outlineTree?.getActiveItemId();
    if (activeItemId) {
      scrollOutlineToActiveItem(scrollContainer, activeItemId);
    }
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
        <Drawer.Title class="ui:text-sm ui:font-semibold ui:text-foreground">
          {$t('course.navItems.nav_content')}
        </Drawer.Title>
      </Drawer.Header>

      <div class="shrink-0 px-3 pb-2">
        <CourseProgressCard {courseProgress} class="rounded-lg border p-3" />
      </div>

      <div bind:this={scrollContainer} class="flex-1 overflow-y-auto px-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <CourseMobileOutlineTree bind:this={outlineTree} {path} {courseId} />
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
