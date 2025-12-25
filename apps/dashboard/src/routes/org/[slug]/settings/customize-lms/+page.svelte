<script lang="ts">
  import { CustomizeLmsPage } from '$features/settings/pages';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';

  let customizeLmsComponent: CustomizeLmsPage | null = $state(null);
  let isSaving = $state(false);

  async function handleSave() {
    isSaving = true;
    try {
      await customizeLmsComponent?.handleSave();
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:head>
  <title>Customize LMS - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full md:max-w-4xl lg:mx-auto">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('components.settings.customize_lms.title')}</Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <Button variant="default" loading={isSaving} disabled={isSaving} onclick={handleSave}>
        {$t('components.settings.customize_lms.save')}
      </Button>
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <CustomizeLmsPage bind:this={customizeLmsComponent} />
    {/snippet}
  </Page.Body>
</Page.Root>
