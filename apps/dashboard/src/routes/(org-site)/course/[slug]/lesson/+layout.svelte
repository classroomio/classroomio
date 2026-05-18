<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { PublicCourse } from '@cio/ui';
  import { toPublicSidebarSections } from '$features/course/utils/public-course-mappers';
  import type { PublicCourseSidebarItem, PublicCourseSidebarSection } from '@cio/ui/custom/public-course';
  import { t } from '$lib/utils/functions/translations';
  import type { Snippet } from 'svelte';

  let { data, children }: { data: { tree: any }; children?: Snippet } = $props();

  const sections: PublicCourseSidebarSection[] = $derived(toPublicSidebarSections(data.tree));
  const flatItems = $derived(sections.flatMap((section) => section.items));

  const itemSlug = $derived(page.params.itemSlug ?? '');
  const activeIndex = $derived(flatItems.findIndex((entry) => entry.slug === itemSlug));
  const activeItem = $derived<PublicCourseSidebarItem | null>(flatItems[activeIndex] ?? null);
  const prevItem = $derived(activeIndex > 0 ? flatItems[activeIndex - 1] : null);
  const nextItem = $derived(activeIndex >= 0 && activeIndex < flatItems.length - 1 ? flatItems[activeIndex + 1] : null);

  const courseTitle = $derived(data.tree.course.title);
  const org = $derived(data.tree.course.org ?? null);

  const hrefFor = (item: PublicCourseSidebarItem) => `/course/${data.tree.course.slug}/lesson/${item.slug}`;

  async function navigateTo(item: PublicCourseSidebarItem | null) {
    if (!item) return;

    await goto(hrefFor(item));
  }
</script>

{#key data.slug}
  <PublicCourse.PublicCourseShell
    {sections}
    {courseTitle}
    {org}
    activeSlug={itemSlug}
    {activeItem}
    activeFlatIndex={activeIndex >= 0 ? activeIndex : null}
    totalItems={flatItems.length}
    hasPrev={!!prevItem}
    hasNext={!!nextItem}
    {prevItem}
    {nextItem}
    {hrefFor}
    exploreHref="/courses"
    signInHref="/login"
    exploreLabel={$t('public_course.header.explore_courses')}
    signInLabel={$t('public_course.header.sign_in')}
    footerPrevLabel={$t('public_course.footer_nav.previous')}
    footerNextLabel={$t('public_course.footer_nav.next')}
    courseSlug={data.tree.course.slug}
    poweredByLabel={$t('public_course.powered_by.label')}
    poweredByBrand={$t('public_course.powered_by.brand')}
    onItemClick={navigateTo}
    onPrev={() => navigateTo(prevItem)}
    onNext={() => navigateTo(nextItem)}
  >
    {@render children?.()}
  </PublicCourse.PublicCourseShell>
{/key}
