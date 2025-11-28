<script>
  import { CustomizeLmsPage } from '$lib/features/settings/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Customize LMS - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full md:max-w-4xl lg:mx-auto">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('components.settings.customize_lms.title')}</Page.Title>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <CustomizeLmsPage />
    {/snippet}
  </Page.Body>
</Page.Root>
