<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import { copyCourseModal, deleteCourseModal } from '$features/course/utils/store';
  import { copyPublicCoursePageUrl, openCoursePreview } from '$features/course/utils/course-preview';
  import { currentOrgDomain } from '$lib/utils/store/org';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { t } from '$lib/utils/functions/translations';

  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  interface Props {
    id: string;
    title: string;
    description: string;
    isPublished?: boolean;
    courseType?: string | null;
    slug?: string;
    /** Compact menu for LMS course cards */
    lmsPublicQuickOnly?: boolean;
  }

  let {
    id,
    title,
    description,
    isPublished = false,
    courseType = null,
    slug = '',
    lmsPublicQuickOnly = false
  }: Props = $props();

  const showPublicCourseLinks = $derived(isPublished && courseType === 'PUBLIC' && slug.trim().length > 0);

  function redirect(url: string) {
    goto(resolve(url, {}));
  }

  function handleShareCourse() {
    redirect(`/courses/${id}/settings#share`);
  }

  function handleInvite() {
    redirect(`/courses/${id}/people?add=true`);
  }

  function handleDeleteCourse() {
    $deleteCourseModal.open = true;
    $deleteCourseModal.id = id;
    $deleteCourseModal.title = title;
  }

  function handleCloneCourse() {
    $copyCourseModal.open = true;
    $copyCourseModal.id = id;
    $copyCourseModal.title = title;
    $copyCourseModal.description = description;
  }

  function handleOpenPublicCourse() {
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

{#if lmsPublicQuickOnly ? showPublicCourseLinks : true}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class="ui:data-[state=open]:opacity-100 absolute top-6 right-6 z-40 flex items-center justify-center opacity-0 transition-all delay-150 duration-200 ease-in-out group-hover:opacity-100"
      onclick={(e) => e.stopPropagation()}
    >
      <IconButton variant="outline">
        <EllipsisVerticalIcon size={16} />
      </IconButton>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      {#if lmsPublicQuickOnly}
        <DropdownMenu.Item onclick={handleOpenPublicCourse}>
          <ExternalLinkIcon size={16} class="mr-2" />
          {$t('courses.course_card.context_menu.open_public_course')}
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => void handleCopyCourseUrl()}>
          <CopyIcon size={16} class="mr-2" />
          {$t('courses.course_card.context_menu.copy_course_url')}
        </DropdownMenu.Item>
      {:else}
        {#if showPublicCourseLinks}
          <DropdownMenu.Item onclick={handleOpenPublicCourse}>
            <ExternalLinkIcon size={16} class="mr-2" />
            {$t('courses.course_card.context_menu.open_public_course')}
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={() => void handleCopyCourseUrl()}>
            <CopyIcon size={16} class="mr-2" />
            {$t('courses.course_card.context_menu.copy_course_url')}
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
        {/if}
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
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
