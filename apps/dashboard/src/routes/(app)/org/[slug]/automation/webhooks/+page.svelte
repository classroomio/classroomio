<script lang="ts">
  import { WebhooksAutomationPage } from '$features/automation/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import { WEBHOOKS_DOCS_URL } from '$features/automation/utils/automation-utils';
</script>

<svelte:head><title>{t.get('automation.tabs.webhooks')} - ClassroomIO</title></svelte:head>
<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('automation.tabs.webhooks')}</Page.Title>
    <Page.Subtitle>{$t('automation.webhooks.page_subtitle')}</Page.Subtitle>
  </Page.HeaderContent>
  <Page.Action>
    <Button
      variant="secondary"
      href={WEBHOOKS_DOCS_URL}
      target="_blank"
      rel="noopener noreferrer"
      testId="automation-webhooks-read-docs"
    >
      <ArrowUpRightIcon size={16} />
      {$t('automation.read_docs')}
    </Button>
  </Page.Action>
</Page.Header>
<Page.Body>{#snippet child()}<WebhooksAutomationPage />{/snippet}</Page.Body>
