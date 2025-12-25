<script lang="ts">
  import { goto } from '$app/navigation';
  import { NewsFeedPage } from '$features/course/pages';
  import { CourseContainer } from '$lib/components/CourseContainer';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';
  import { RoleBasedSecurity } from '$features/ui';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { getGreeting } from '$lib/utils/functions/date.js';
  import type { AccountOrg } from '$features/app/types';
  import { isNewFeedModal } from '$lib/components/Course/components/NewsFeed/store';

  let { data = $bindable() } = $props();

  function getPageRoles(org: AccountOrg) {
    const roles: number[] = [1, 2];

    if (org.customization.course.newsfeed) {
      roles.push(3);
    }

    return roles;
  }
</script>

<svelte:head>
  <title>News Feed - ClassroomIO</title>
</svelte:head>

<CourseContainer courseId={data.courseId}>
  <RoleBasedSecurity
    allowedRoles={getPageRoles($currentOrg)}
    onDenied={() => {
      goto(`/courses/${data.courseId}/lessons?next=true`);
    }}
  >
    <Page.Header>
      <Page.HeaderContent>
        <Page.Title>
          {$t(getGreeting())}
          {$profile.fullname}!
        </Page.Title>
      </Page.HeaderContent>
      <Page.Action>
        <Button class="mr-2" onclick={() => ($isNewFeedModal.open = true)}>
          {$t('course.navItem.news_feed.heading_button.title')}
        </Button>
      </Page.Action>
    </Page.Header>

    <Page.Body>
      {#snippet child()}
        <NewsFeedPage courseId={data.courseId} />
      {/snippet}
    </Page.Body>
  </RoleBasedSecurity>
</CourseContainer>
