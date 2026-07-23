<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { copyCourseModal, deleteCourseModal } from '$features/course/utils/store';
  import { copyPublicCoursePageUrl, openCoursePreview } from '$features/course/utils/course-preview';
  import { currentOrgDomain } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    id: string;
    title: string;
    description: string;
    isPublished?: boolean;
    courseType?: string | null;
    slug?: string;
    /** Compact menu for LMS course cards */
    lmsPublicQuickOnly?: boolean;
    /** Include "View as student" (course header menu) */
    includeViewAsStudent?: boolean;
    onViewAsStudent?: () => void;
    /** List view includes an explicit Open action */
    includeOpen?: boolean;
    /** Hide org management actions (clone, share, invite, delete) */
    hideOrgActions?: boolean;
  }

  let {
    id,
    title,
    description,
    isPublished = false,
    courseType = null,
    slug = '',
    lmsPublicQuickOnly = false,
    includeViewAsStudent = false,
    onViewAsStudent,
    includeOpen = false,
    hideOrgActions = false
  }: Props = $props();

  const showPublicCourseLinks = $derived(isPublished && courseType === 'PUBLIC' && slug.trim().length > 0);
  const courseSettingsPath = $derived(resolve(`/courses/${id}/settings`, {}));

  function redirect(url: string) {
    goto(resolve(url, {}));
  }

  function scrollToSettingsSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleShareCourse() {
    if (page.url.pathname === courseSettingsPath) {
      scrollToSettingsSection('share');
      return;
    }

    redirect(`/courses/${id}/settings#share`);
  }

  function handleInvite() {
    redirect(`/courses/${id}/people?add=true`);
  }

  function handlePublishCourse() {
    redirect(`/courses/${id}/settings?highlight=publish#publish`);
  }

  function handleDeleteCourse() {
    if (page.url.pathname === courseSettingsPath) {
      scrollToSettingsSection('delete');
      return;
    }

    const isOnOrgCoursesList = /\/org\/[^/]+\/courses\/?$/.test(page.url.pathname);
    if (isOnOrgCoursesList) {
      $deleteCourseModal.open = true;
      $deleteCourseModal.id = id;
      $deleteCourseModal.title = title;
      return;
    }

    redirect(`/courses/${id}/settings#delete`);
  }

  function handleCloneCourse() {
    $copyCourseModal.open = true;
    $copyCourseModal.id = id;
    $copyCourseModal.title = title;
    $copyCourseModal.description = description;
  }

  function handleOpenCourse() {
    redirect(`/courses/${id}`);
  }

  function handleViewCourseSite() {
    openCoursePreview({
      courseId: id,
      courseSlug: slug,
      currentOrgDomain: $currentOrgDomain
    });
  }

  async function handleCopyCourseUrl() {
    await copyPublicCoursePageUrl(slug, $currentOrgDomain);
  }
</script>

{#if lmsPublicQuickOnly}
  <DropdownMenu.Item onclick={handleViewCourseSite}>
    {$t('courses.course_card.context_menu.view_course_site')}
  </DropdownMenu.Item>
  <DropdownMenu.Item onclick={() => void handleCopyCourseUrl()}>
    {$t('courses.course_card.context_menu.copy_course_url')}
  </DropdownMenu.Item>
{:else}
  {#if includeViewAsStudent}
    <DropdownMenu.Item onclick={() => onViewAsStudent?.()}>
      {$t('course.header.view_as_student')}
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
  {/if}

  {#if isPublished}
    <DropdownMenu.Item onclick={handleViewCourseSite}>
      {$t('courses.course_card.context_menu.view_course_site')}
    </DropdownMenu.Item>
    {#if showPublicCourseLinks}
      <DropdownMenu.Item onclick={() => void handleCopyCourseUrl()}>
        {$t('courses.course_card.context_menu.copy_course_url')}
      </DropdownMenu.Item>
    {/if}
    {#if !hideOrgActions || includeOpen}
      <DropdownMenu.Separator />
    {/if}
  {:else}
    <DropdownMenu.Item onclick={handlePublishCourse}>
      {$t('courses.course_card.context_menu.publish_course')}
    </DropdownMenu.Item>
    {#if !hideOrgActions || includeOpen}
      <DropdownMenu.Separator />
    {/if}
  {/if}

  {#if includeOpen}
    <DropdownMenu.Item onclick={handleOpenCourse}>
      {$t('courses.course_card.context_menu.open')}
    </DropdownMenu.Item>
  {/if}

  {#if !hideOrgActions}
    <DropdownMenu.Item onclick={handleCloneCourse}>
      {$t('courses.course_card.context_menu.clone')}
    </DropdownMenu.Item>
    <DropdownMenu.Item onclick={handleShareCourse}>
      {$t('courses.course_card.context_menu.share')}
    </DropdownMenu.Item>
    <DropdownMenu.Item onclick={handleInvite}>
      {$t('courses.course_card.context_menu.invite')}
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item class="text-red-600" onclick={handleDeleteCourse}>
      {$t('courses.course_card.context_menu.delete')}
    </DropdownMenu.Item>
  {/if}
{/if}
