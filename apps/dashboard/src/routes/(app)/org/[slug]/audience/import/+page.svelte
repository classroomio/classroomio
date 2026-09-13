<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { ImportAudiencePage } from '$features/audience/pages';
  import { BackButton } from '@cio/ui';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import type { ImportControls } from '$features/audience/utils/types';

  let { data } = $props();

  // Bound from the page below: the step's actions belong in the header, but the
  // step's state lives in the component the header cannot reach.
  let controls = $state<ImportControls | null>(null);

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
      <Page.Subtitle>{$t('audience.import.page_subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
    {#if controls?.step === 'preview'}
      <Page.Action>
        <Button variant="secondary" onclick={controls.startOver} disabled={controls.isSubmitting}>
          {$t('audience.import.start_over')}
        </Button>
        <Button
          onclick={controls.submit}
          loading={controls.isSubmitting}
          disabled={controls.isSubmitting || controls.readyCount === 0}
        >
          {$t('audience.import.submit_count', { count: controls.readyCount })}
        </Button>
      </Page.Action>
    {/if}
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <ImportAudiencePage courses={data.courses} cohorts={data.cohorts} bind:controls />
    {/snippet}
  </Page.Body>
</Page.Root>
