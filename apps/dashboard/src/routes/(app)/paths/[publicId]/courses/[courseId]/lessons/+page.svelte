<script lang="ts">
  import { LessonsPage } from '$features/course/pages';
  import ContentPageMenu from '$features/course/components/lesson/content-page-menu.svelte';
  import { Button } from '@cio/ui/base/button';
  import { RefreshPageData, RoleBasedSecurity } from '$features/ui';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { contentCreateStoreUtils, contentEditingStore } from '$features/course/components/content/store';
  import { courseApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';

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

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
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
        <ContentPageMenu courseId={data.courseId} disabled={!!$contentEditingStore} />
        <RefreshPageData onRefresh={() => courseApi.refreshCourse(data.courseId, $profile.id)} />
      </div>
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <LessonsPage courseId={data.courseId} bind:reorder />
    {/snippet}
  </Page.Body>
</Page.Root>
