<script lang="ts">
  import { LessonsPage } from '$features/course/pages';
  import { CourseContainer } from '$lib/components/CourseContainer';
  import { Button } from '@cio/ui/base/button';
  import { RoleBasedSecurity } from '$features/ui';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import { COURSE_VERSION } from '$lib/utils/types';
  import { getGreeting } from '$lib/utils/functions/date.js';
  import { course } from '$lib/components/Course/store';
  import { handleAddLessonWidget } from '$lib/components/Course/components/Lesson/store';

  let { data } = $props();

  let reorder = $state(false);
  let activateSections = $state(false);
  let lessonEditing: string | undefined;

  function addLesson() {
    $handleAddLessonWidget.open = true;
    $handleAddLessonWidget.isSection = $course.version === COURSE_VERSION.V2;
  }
</script>

<svelte:head>
  <title>Lessons - ClassroomIO</title>
</svelte:head>

<CourseContainer courseId={data.courseId}>
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t(getGreeting())}
        {$profile.fullname}!
      </Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <div class="flex w-full justify-end gap-2">
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          {#if $course.version === COURSE_VERSION.V1}
            <Button variant="outline" onclick={() => (activateSections = !activateSections)} disabled={!!lessonEditing}>
              {$t(`course.navItem.lessons.section_prompt.cta`)}
            </Button>
          {/if}
          <Button variant="outline" onclick={() => (reorder = !reorder)} disabled={!!lessonEditing}>
            {$t(`course.navItem.lessons.add_lesson.${reorder ? 'end_reorder' : 'start_reorder'}`)}
          </Button>
          <Button onclick={addLesson} disabled={!!lessonEditing}>
            {$t('course.navItem.lessons.add_lesson.button_title')}
          </Button>
        </RoleBasedSecurity>
      </div>
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <LessonsPage courseId={data.courseId} />
    {/snippet}
  </Page.Body>
</CourseContainer>
