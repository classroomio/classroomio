<script lang="ts">
  import { NotificationsPage } from '$features/settings/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>{t.get('settings.notifications.page_title')} - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('settings.notifications.heading')}</Page.Title>
    <Page.Subtitle>{$t('settings.notifications.personal_page_subtitle')}</Page.Subtitle>
  </Page.HeaderContent>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <NotificationsPage />
  {/snippet}
</Page.Body>
