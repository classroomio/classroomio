<script lang="ts">
  import { WebhooksAutomationPage } from '$features/automation/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head><title>{t.get('automation.tabs.webhooks')} - ClassroomIO</title></svelte:head>
<Page.Header
  ><Page.HeaderContent
    ><Page.Title>{$t('automation.tabs.webhooks')}</Page.Title><Page.Subtitle
      >{$t('automation.webhooks.page_subtitle')}</Page.Subtitle
    ></Page.HeaderContent
  ></Page.Header
>
<Page.Body>{#snippet child()}<WebhooksAutomationPage />{/snippet}</Page.Body>
