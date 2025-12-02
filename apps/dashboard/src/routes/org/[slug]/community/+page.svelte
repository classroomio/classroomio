<script>
  import { CommunityPage } from '$lib/features/community/pages';
  import { AskCommunityButton } from '$lib/features/community/components';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Community - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('community.title')}</Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <AskCommunityButton />
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <CommunityPage />
    {/snippet}
  </Page.Body>
</Page.Root>
