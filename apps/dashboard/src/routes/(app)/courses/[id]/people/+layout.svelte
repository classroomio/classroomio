<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Button } from '@cio/ui/base/button';
  import { RefreshPageData, RoleBasedSecurity } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import * as Page from '@cio/ui/base/page';
  import { courseApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import ResetProgressButton from '$features/course/components/people/reset-progress-button.svelte';
  import type { UserCourseAnalytics } from '$features/course/utils/types';

  let { data = $bindable(), children } = $props();

  let userCourseAnalytics = $derived(page.data.userCourseAnalytics as UserCourseAnalytics | null | undefined);

  // Get back URL from query parameters
  let backUrl = $derived(page.url.searchParams.get('back'));

  const handleClick = () => {
    goto(resolve(`${page.url.pathname}?add=true`, {}));
  };

  const handleBackNavigation = () => {
    if (backUrl) {
      goto(resolve(backUrl, {}));
    } else {
      goto(resolve(`/courses/${data.courseId}/people`, {}));
    }
  };

  async function refreshPeoplePage() {
    await Promise.all([courseApi.refreshCourse(data.courseId, $profile.id), invalidateAll()]);
  }

  async function handleProgressReset() {
    await invalidateAll();
  }
</script>

<Page.Root class="mx-auto w-[90%] md:max-w-3xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {#if data.personId}
          <RoleBasedSecurity allowedRoles={[1, 2]}>
            <IconButton onclick={handleBackNavigation}>
              <ArrowLeftIcon size={16} />
            </IconButton>
          </RoleBasedSecurity>
        {/if}
        {$t('course.navItem.people.title')}
      </Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <div class="flex items-center gap-2">
        {#if data.personId && userCourseAnalytics}
          <RoleBasedSecurity allowedRoles={[1, 2]}>
            <ResetProgressButton courseId={data.courseId} {userCourseAnalytics} onSuccess={handleProgressReset} />
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
