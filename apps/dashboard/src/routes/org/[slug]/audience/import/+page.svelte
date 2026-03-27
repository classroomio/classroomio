<script lang="ts">
  import { ImportAudiencePage } from '$features/audience/pages';
  import { BackButton } from '@cio/ui';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';

  let { data } = $props();

  const audiencePath = $derived(page.url.pathname.replace(/\/import$/, ''));
</script>

<svelte:head>
  <title>{$t('audience.import.title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="mx-auto w-full max-w-3xl">
  <Page.Header>
    <Page.HeaderContent>
      <BackButton href={resolve(audiencePath, {})} label={$t('audience.import.back')} class="p-0!" />
      <Page.Title>{$t('audience.import.title')}</Page.Title>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <ImportAudiencePage courses={data.courses} />
    {/snippet}
  </Page.Body>
</Page.Root>
