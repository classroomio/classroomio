<script lang="ts">
  // import { onMount } from 'svelte';
  import { defaultAiTutorSettings } from '@cio/ai-assistant/tutor-config';

  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';

  import { t } from '$lib/utils/functions/translations';
  import { aiTutorApi } from '../api/ai-tutor.svelte';
  import { applyOrgSettings, orgTutorSettingsStore } from '../store/tutor-settings-store';
  import TutorSettingsForm from '../components/tutor-settings-form.svelte';
  import { currentOrg } from '$lib/utils/store/org';

  let initialized = $state(false);

  let fetchedOrgId = $state<string | null>(null);

  async function intitializeSettings() {
    await aiTutorApi.fetchOrgSettings();

    applyOrgSettings(aiTutorApi.orgSettings ?? defaultAiTutorSettings);

    initialized = true;
  }

  $effect(() => {
    const orgId = $currentOrg?.id;

    if (!orgId || fetchedOrgId === orgId) return;
    fetchedOrgId = orgId;

    intitializeSettings();
  });

  // onMount(async () => {
  //   await aiTutorApi.fetchOrgSettings();
  //   applyOrgSettings(aiTutorApi.orgSettings ?? defaultAiTutorSettings);
  //   initialized = true;
  // });

  async function handleSave() {
    await aiTutorApi.updateOrgSettings($orgTutorSettingsStore);
  }
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
  <Page.Header isSticky class="ui:bg-background z-10">
    <Page.HeaderContent>
      <Page.Title>{$t('aiTutor.page.org.title')}</Page.Title>
      <Page.Subtitle>{$t('aiTutor.page.org.description')}</Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      <Button loading={aiTutorApi.saving} disabled={aiTutorApi.saving || !initialized} onclick={handleSave}>
        {$t('aiTutor.action.save')}
      </Button>
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      {#if !initialized}
        <p class="ui:text-muted-foreground text-sm">{$t('aiTutor.state.loading')}</p>
      {:else}
        <TutorSettingsForm store={orgTutorSettingsStore} disabled={aiTutorApi.saving} />
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
