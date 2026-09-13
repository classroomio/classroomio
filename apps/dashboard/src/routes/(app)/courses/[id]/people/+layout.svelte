<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { Button } from '@cio/ui/base/button';
  import { BackButton } from '@cio/ui/custom/back-button';
  import { RefreshPageData, RoleBasedSecurity } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
  import { courseApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import StudentActionsMenu from '$features/course/components/people/student-actions-menu.svelte';
  import type { UserCourseAnalytics } from '$features/course/utils/types';

  let { data = $bindable(), children } = $props();

  let userCourseAnalytics = $derived(page.data.userCourseAnalytics as UserCourseAnalytics | null | undefined);

  let backUrl = $derived.by(() => {
    const back = page.url.searchParams.get('back');
    if (back) {
      return resolve(back, {});
    } else {
      return resolve(`/courses/${data.courseId}/people`, {});
    }
  });

  const handleClick = () => {
    goto(resolve(`${page.url.pathname}?add=true`, {}));
  };

  async function refreshPeoplePage() {
    await Promise.all([courseApi.refreshCourse(data.courseId, $profile.id), invalidateAll()]);
  }

  async function handleProgressReset() {
    await invalidateAll();
  }
</script>

<Page.Root class="mx-auto w-[90%] px-4 md:max-w-5xl">
  <Page.Header>
    <Page.HeaderContent>
      {#if data.personId}
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <BackButton href={backUrl} label={$t('audience.import.back')} class="p-0!" />
        </RoleBasedSecurity>
      {/if}
      {#if !data.personId}
        <Page.Title>{$t('course.navItem.people.title')}</Page.Title>
      {/if}
    </Page.HeaderContent>
    <Page.Action>
      <div class="flex items-center gap-2">
        {#if data.personId && userCourseAnalytics}
          <RoleBasedSecurity allowedRoles={[1, 2]}>
            <StudentActionsMenu
              courseId={data.courseId}
              personId={data.personId}
              {userCourseAnalytics}
              onSuccess={handleProgressReset}
            />
          </RoleBasedSecurity>
        {/if}
        {#if !data.personId}
          <RoleBasedSecurity allowedRoles={[1, 2]}>
            <Button onclick={handleClick}>
              {$t('course.navItem.people.add')}
            </Button>
          </RoleBasedSecurity>
        {/if}
        <RefreshPageData onRefresh={refreshPeoplePage} />
      </div>
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      {@render children?.()}
    {/snippet}
  </Page.Body>
</Page.Root>
