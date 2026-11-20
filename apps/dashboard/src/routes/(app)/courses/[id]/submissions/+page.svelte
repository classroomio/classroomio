<script lang="ts">
  import { SubmissionsPage } from '$features/course/pages';
  import { RefreshPageData } from '$features/ui';
  import { Empty } from '@cio/ui/custom/empty';
  import * as Page from '@cio/ui/base/page';
  import LockKeyhole from '@lucide/svelte/icons/lock-keyhole';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();
</script>

{#if data.gradingAccess === 'denied'}
  <Page.Root class="mx-auto flex w-[calc(95vw-var(--sidebar-width))]!">
    <Page.Header>
      <Page.HeaderContent>
        <Page.Title>
          {$t('course.navItem.submissions.title')}
        </Page.Title>
      </Page.HeaderContent>
    </Page.Header>

    <Page.Body>
      {#snippet child()}
        <Empty
          title={$t('course.navItem.submissions.access.denied_title')}
          description={$t('course.navItem.submissions.access.denied_description')}
          icon={LockKeyhole}
          variant="page"
        />
      {/snippet}
    </Page.Body>
  </Page.Root>
{:else}
  <Page.Root class="mx-auto flex w-[calc(95vw-var(--sidebar-width))]!">
    <Page.Header>
      <Page.HeaderContent>
        <Page.Title>
          {$t('course.navItem.submissions.title')}
        </Page.Title>
      </Page.HeaderContent>
      <Page.Action>
        <RefreshPageData />
      </Page.Action>
    </Page.Header>

    <Page.Body>
      {#snippet child()}
        <SubmissionsPage
          courseId={data.courseId}
          sections={data.sections || []}
          submissionIdData={data.submissionIdData || {}}
        />
      {/snippet}
    </Page.Body>
  </Page.Root>
{/if}
