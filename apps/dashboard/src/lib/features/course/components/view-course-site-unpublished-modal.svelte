<script lang="ts">
  import { tick } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { courseApi } from '$features/course/api';
  import { publishCourse } from '$features/course/utils/publish-course';
  import { openCoursePreview } from '$features/course/utils/course-preview';
  import { goToCourseCompletionDeadline } from '$features/course/utils/compliance-deadline';
  import { t } from '$lib/utils/functions/translations';
  import CertificateDeadlineRequiredDialog from './certificate-deadline-required-dialog.svelte';

  interface Props {
    open?: boolean;
    currentOrgDomain?: string;
  }

  let { open = $bindable(false), currentOrgDomain = '' }: Props = $props();

  let isPublishing = $state(false);
  let openDeadlineDialog = $state(false);

  async function handlePublishCourse() {
    const course = courseApi.course;
    if (!course?.id) {
      return;
    }

    isPublishing = true;

    const result = await publishCourse(course);
    isPublishing = false;

    if (!result.ok && result.reason === 'missing_deadline') {
      open = false;
      await tick();
      openDeadlineDialog = true;
      return;
    }

    if (!result.ok) {
      return;
    }

    open = false;

    openCoursePreview({
      courseId: course.id,
      courseSlug: courseApi.course?.slug,
      currentOrgDomain
    });
  }

  function goToCompletionDeadline() {
    const courseId = courseApi.course?.id;
    openDeadlineDialog = false;

    if (!courseId) {
      return;
    }

    goToCourseCompletionDeadline(courseId);
  }
</script>

<Dialog.Root
  bind:open
  onOpenChange={(isOpen) => {
    if (!isOpen && !isPublishing) {
      open = false;
    }
  }}
>
  <Dialog.Content class="w-[calc(100%-2rem)] max-w-md! p-4">
    <Dialog.Header>
      <Dialog.Title>{$t('course.view_course_site.unpublished_title')}</Dialog.Title>
      <Dialog.Description>{$t('course.view_course_site.unpublished_description')}</Dialog.Description>
    </Dialog.Header>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (open = false)} disabled={isPublishing}>
        {$t('course.view_course_site.cancel')}
      </Button>
      <Button variant="default" onclick={handlePublishCourse} loading={isPublishing} disabled={!courseApi.course?.id}>
        {$t('course.view_course_site.publish_course')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<CertificateDeadlineRequiredDialog bind:open={openDeadlineDialog} onGoToDeadline={goToCompletionDeadline} />
