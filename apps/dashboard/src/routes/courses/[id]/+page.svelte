<script lang="ts">
  import { goto } from '$app/navigation';
  import { NewsFeedPage } from '$features/course/pages';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';
  import { RoleBasedSecurity } from '$features/ui';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import type { AccountOrg } from '$features/app/types';
  import { newsfeedApi } from '$features/course/api';

  let { data = $bindable() } = $props();

  function getPageRoles(org: AccountOrg) {
    const roles: number[] = [1, 2];

    if (org.customization.course.newsfeed) {
      roles.push(3);
    }

    return roles;
  }
</script>

<RoleBasedSecurity
  allowedRoles={getPageRoles($currentOrg)}
  onDenied={() => {
    goto(`/courses/${data.courseId}/lessons?next=true`);
  }}
>
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t('course.navItem.news_feed.heading')}
      </Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <Button class="mr-2" onclick={() => newsfeedApi.openNewFeedModal()}>
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
