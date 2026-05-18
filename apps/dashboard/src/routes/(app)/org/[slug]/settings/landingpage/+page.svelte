<script lang="ts">
  import { LandingpagePage } from '$features/settings/pages';
  import { VisitOrgSiteButton } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Landing Page Settings - ClassroomIO</title>
</svelte:head>

<Page.Header isSticky>
  <Page.HeaderContent>
    <Page.Title>{$t('settings.landing_page.heading')}</Page.Title>
    <Page.Subtitle>{$t('settings.landing_page.page_subtitle')}</Page.Subtitle>
  </Page.HeaderContent>
  <Page.Action>
    <VisitOrgSiteButton labelKey="markdown_editor.preview" variant="secondary" />
  </Page.Action>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <LandingpagePage />
  {/snippet}
</Page.Body>
