<script lang="ts">
  import { UserAnalyticsPage } from '$features/audience/pages';
  import { BackButton } from '@cio/ui';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';

  let { data } = $props();
</script>

<svelte:head>
  <title>{t.get('audience.user_analytics.title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full md:max-w-5xl lg:mx-auto">
  <Page.Header>
    <Page.HeaderContent>
      <BackButton href={`${$currentOrgPath}/audience`} label={$t('community.ask.go_back')} />
      <Page.Title>{$t('audience.user_analytics.title')}</Page.Title>
      <Page.Subtitle>{$t('audience.user_analytics.page_subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <UserAnalyticsPage {data} />
    {/snippet}
  </Page.Body>
</Page.Root>
