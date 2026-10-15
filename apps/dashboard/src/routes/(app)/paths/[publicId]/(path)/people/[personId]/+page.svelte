<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import * as Page from '@cio/ui/base/page';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { BackButton } from '@cio/ui/custom/back-button';
  import { Empty } from '@cio/ui/custom/empty';
  import { Button } from '@cio/ui/base/button';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { t } from '$lib/utils/functions/translations';
  import { MemberCourseList, MemberProgressRail } from '$features/learning-path';
  import { RefreshPageData } from '$features/ui';
  import { learningPathApi, pathMembersApi } from '$features/learning-path/api';

  const publicId = $derived(page.params.publicId ?? '');
  const personId = $derived(page.params.personId ?? '');
  const pathId = $derived(learningPathApi.currentPath?.id);
  const detail = $derived(pathMembersApi.memberDetail);

  let loadedKey: string | null = $state(null);

  const backUrl = $derived.by(() => {
    const back = page.url.searchParams.get('back');
    if (back) {
      return resolve(back, {});
    }
    return resolve(`/paths/${publicId}/people`, {});
  });

  function fetchDetail(activePathId: string, activePersonId: string) {
    untrack(() => {
      loadedKey = `${activePathId}:${activePersonId}`;
      void pathMembersApi.getMemberDetail(activePathId, activePersonId);
    });
  }

  async function handleRefresh() {
    if (pathId) {
      await learningPathApi.refreshPath(publicId);
    }
    if (pathId && personId) {
      fetchDetail(pathId, personId);
    }
  }

  function handleRetry() {
    if (pathId && personId) {
      fetchDetail(pathId, personId);
    }
  }

  $effect(() => {
    const activePathId = pathId;
    const activePersonId = personId;
    if (!activePathId || !activePersonId) return;
    if (loadedKey === `${activePathId}:${activePersonId}`) return;

    fetchDetail(activePathId, activePersonId);
  });
</script>

<Page.Root class="mx-auto w-[90%] px-4 md:max-w-5xl">
  <Page.Header>
    <Page.HeaderContent>
      <BackButton href={backUrl} label={$t('audience.import.back')} class="p-0!" />
    </Page.HeaderContent>
    <Page.Action>
      <RefreshPageData onRefresh={handleRefresh} />
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      {#if pathMembersApi.isLoadingMemberDetail && !detail}
        <div class="space-y-4">
          <Skeleton class="h-32 w-full" />
          <Skeleton class="h-64 w-full" />
        </div>
      {:else if pathMembersApi.loadErrorMemberDetail || (!pathMembersApi.isLoadingMemberDetail && !detail)}
        <Empty
          variant="page"
          icon={TriangleAlertIcon}
          title={$t('audience.user_analytics.load_failed_title')}
          description={$t('audience.user_analytics.load_failed_description')}
        >
          {#snippet children()}
            <Button onclick={handleRetry}>{$t('audience.user_analytics.retry')}</Button>
          {/snippet}
        </Empty>
      {:else if detail}
        <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[19rem_1fr]">
          <MemberProgressRail {detail} />
          <MemberCourseList {detail} />
        </div>
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
