<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { NewsFeedPage } from '$features/course/pages';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';
  import { RefreshPageData, RoleBasedSecurity } from '$features/ui';
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
    goto(resolve(`/courses/${data.courseId}/lessons?next=true`, {}));
  }}
>
  <Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
    <Page.Header>
      <Page.HeaderContent>
        <Page.Title>
          {$t('course.navItem.news_feed.heading')}
        </Page.Title>
      </Page.HeaderContent>
      <Page.Action>
        <div class="flex items-center gap-2">
          <Button onclick={() => newsfeedApi.openNewFeedModal()}>
            {$t('course.navItem.news_feed.heading_button.title')}
          </Button>
          <RefreshPageData onRefresh={() => newsfeedApi.list(data.courseId)} />
        </div>
      </Page.Action>
    </Page.Header>

    <Page.Body>
      {#snippet child()}
        <NewsFeedPage courseId={data.courseId} />
      {/snippet}
    </Page.Body>
  </Page.Root>
</RoleBasedSecurity>
