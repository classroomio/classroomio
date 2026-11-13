<script lang="ts">
  import { OrgChooser } from '$features/org';
  import { t } from '$lib/utils/functions/translations';
</script>

<svelte:head>
  <title>{$t('org_chooser.page_title')}</title>
</svelte:head>

<OrgChooser />
