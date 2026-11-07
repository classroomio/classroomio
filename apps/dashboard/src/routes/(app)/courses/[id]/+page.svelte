<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { NewsFeedPage } from '$features/course/pages';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';
  import { RefreshPageData, RoleBasedSecurity, preloadTextEditor } from '$features/ui';
  import { currentOrg } from '$lib/utils/store/org';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import type { AccountOrg } from '$features/app/types';
  import { newsfeedApi } from '$features/course/api';
  import PluginSlotRenderer from '$features/plugins/components/plugin-slot-renderer.svelte';

  let { data = $bindable() } = $props();

  let asideSlotCount = $state(0);

  function getPageRoles(org: AccountOrg) {
    const roles: number[] = [1, 2];

    if (org.customization.course.newsfeed) {
      roles.push(3);
    }

    return roles;
  }

  onMount(() => {
    void preloadTextEditor();
  });
</script>

<RoleBasedSecurity
  allowedRoles={getPageRoles($currentOrg)}
  onDenied={() => {
    goto(resolve(`/courses/${data.courseId}/lessons?next=true`, {}));
  }}
>
  <Page.Root
    class={asideSlotCount > 0
      ? 'mx-auto flex w-[90%] px-4 md:max-w-4xl lg:max-w-5xl xl:max-w-6xl'
      : 'mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl'}
  >
    <Page.Header>
      <Page.HeaderContent>
        <Page.Title>
          {$t('course.navItem.news_feed.heading')}
        </Page.Title>
      </Page.HeaderContent>
      <Page.Action>
        <div class="flex items-center gap-2">
          {#if !$isOrgStudent}
            <Button onmouseenter={() => preloadTextEditor()} onclick={() => newsfeedApi.openNewFeedModal()}>
              {$t('course.navItem.news_feed.heading_button.title')}
            </Button>
          {/if}
          <RefreshPageData onRefresh={() => newsfeedApi.list(data.courseId)} />
        </div>
      </Page.Action>
    </Page.Header>

    <Page.Body>
      {#snippet child()}
        <div class="flex flex-col gap-6 {asideSlotCount > 0 ? 'lg:flex-row lg:items-start' : ''}">
          <div class="min-w-0 flex-1">
            <NewsFeedPage courseId={data.courseId} />
          </div>
          <aside class="w-full shrink-0 lg:w-[260px] xl:w-[280px]" class:hidden={asideSlotCount === 0}>
            <div class="sticky top-6 flex flex-col gap-4">
              <PluginSlotRenderer
                target="course.newsfeed.aside"
                resource={{ type: 'course', id: data.courseId }}
                bind:count={asideSlotCount}
              />
            </div>
          </aside>
        </div>
      {/snippet}
    </Page.Body>
  </Page.Root>
</RoleBasedSecurity>
