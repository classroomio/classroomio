<script lang="ts">
  import { LessonsPage } from '$features/course/pages';
  import { Button } from '@cio/ui/base/button';
  import { RoleBasedSecurity } from '$features/ui';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { contentCreateStoreUtils, contentEditingStore } from '$features/course/components/content/store';
  import { courseApi } from '$features/course/api';

  let { data } = $props();

  let reorder = $state(false);

  function addContent() {
    const contentGroupingEnabled = courseApi.course?.metadata?.isContentGroupingEnabled ?? true;
    if (contentGroupingEnabled) {
      contentCreateStoreUtils.openSection();
    } else {
      contentCreateStoreUtils.openDefault();
    }
  }
</script>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>
      {$t('course.navItem.lessons.heading_v2')}
    </Page.Title>
  </Page.HeaderContent>
  <Page.Action>
    <div class="flex w-full justify-end gap-2">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <Button variant="outline" onclick={() => (reorder = !reorder)} disabled={!!$contentEditingStore}>
          {$t(`course.navItem.lessons.add_lesson.${reorder ? 'end_reorder' : 'start_reorder'}`)}
        </Button>
        <Button onclick={addContent} disabled={!!$contentEditingStore}
          >{$t('course.navItem.lessons.add_content')}</Button
        >
      </RoleBasedSecurity>
    </div>
  </Page.Action>
</Page.Header>

<Page.Body>
  {#snippet child()}
    <LessonsPage courseId={data.courseId} bind:reorder />
  {/snippet}
</Page.Body>
