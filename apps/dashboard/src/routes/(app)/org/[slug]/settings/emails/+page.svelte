<script lang="ts">
  import { EmailsPage } from '$features/settings/pages';
  import { t } from '$lib/utils/functions/translations';
</script>

<svelte:head>
  <title>{$t('settings.emails.page_title')} - ClassroomIO</title>
</svelte:head>

<EmailsPage />
