<script lang="ts">
  import { AskCommunityPage } from '$features/community/pages';
  import { BackButton } from '@cio/ui';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';

  const communityPath = $derived(page.url.pathname.replace(/\/ask$/, ''));
</script>

<svelte:head>
  <title>Ask the Community - ClassroomIO</title>
</svelte:head>

<Page.Root class="mx-auto w-[90%]!">
  <Page.Header>
    <Page.HeaderContent>
      <BackButton href={resolve(communityPath, {})} label={$t('community.ask.go_back')} />
      <Page.Title>{$t('community.ask.ask_the')}</Page.Title>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <AskCommunityPage />
    {/snippet}
  </Page.Body>
</Page.Root>
