<script lang="ts">
  import { ApiAutomationPage } from '$features/automation/pages';
  import { automationApi } from '$features/automation/api/automation.svelte';
  import { PUBLIC_API_DOCS_URL } from '$features/automation/utils/automation-utils';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';

  let { data } = $props();
  $effect(() => {
    automationApi.keys = data.keys;
    automationApi.isFetched = true;
  });
</script>

<svelte:head><title>{t.get('automation.tabs.api')} - ClassroomIO</title></svelte:head>
<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('automation.tabs.api')}</Page.Title>
    <Page.Subtitle>{$t('automation.api.subtitle')}</Page.Subtitle>
  </Page.HeaderContent>
  <Page.Action>
    <Button
      variant="secondary"
      href={PUBLIC_API_DOCS_URL}
      target="_blank"
      rel="noopener noreferrer"
      testId="automation-api-read-docs"
    >
      <ArrowUpRightIcon size={16} />
      {$t('automation.read_docs')}
    </Button>
  </Page.Action>
</Page.Header>
<Page.Body>{#snippet child()}<ApiAutomationPage />{/snippet}</Page.Body>
