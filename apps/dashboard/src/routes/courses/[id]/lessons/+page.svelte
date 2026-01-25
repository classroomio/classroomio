<script lang="ts">
  import { LessonsPage } from '$features/course/pages';
  import { Button } from '@cio/ui/base/button';
  import { RoleBasedSecurity } from '$features/ui';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import { getGreeting } from '$lib/utils/functions/date';
  import { contentCreateStore } from '$features/course/components/content/store';
  import { ContentType } from '@cio/utils/constants/content';

  let { data } = $props();

  let reorder = $state(false);
  let lessonEditing: string | undefined;

  function addContent() {
    contentCreateStore.set({
      open: true,
      sectionId: '',
      initialType: ContentType.Lesson
    });
  }
</script>

<svelte:head>
  <title>Lessons - ClassroomIO</title>
</svelte:head>

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
        <Button variant="outline" onclick={() => (reorder = !reorder)} disabled={!!lessonEditing}>
          {$t(`course.navItem.lessons.add_lesson.${reorder ? 'end_reorder' : 'start_reorder'}`)}
        </Button>
        <Button onclick={addContent} disabled={!!lessonEditing}>{$t('course.navItem.lessons.add_content')}</Button>
      </RoleBasedSecurity>
    </div>
  </Page.Action>
</Page.Header>

<Page.Body>
  {#snippet child()}
    <LessonsPage courseId={data.courseId} bind:reorder />
  {/snippet}
</Page.Body>
