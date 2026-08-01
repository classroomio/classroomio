<script lang="ts">
  import { onMount } from 'svelte';
  import { defaultAiTutorSettings, type AiTutorSettings } from '@cio/ai-assistant/tutor-config';
  import { get } from 'svelte/store';

  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { aiTutorApi } from '../api/ai-tutor.svelte';
  import { applyOrgSettings, orgTutorSettingsStore } from '../store/tutor-settings-store';
  import TutorSettingsForm from '../components/tutor-settings-form.svelte';

  let initialized = $state(false);
  let savedSettingsSnapshot = $state('');
  let formSettings = $state<AiTutorSettings>({ ...defaultAiTutorSettings });

  $effect(() => {
    const unsubscribe = orgTutorSettingsStore.subscribe((value) => {
      formSettings = value;
    });

    return unsubscribe;
  });

  const hasUnsavedChanges = $derived(
    initialized && savedSettingsSnapshot !== '' && JSON.stringify(formSettings) !== savedSettingsSnapshot
  );

  function captureSavedSnapshot() {
    savedSettingsSnapshot = JSON.stringify(get(orgTutorSettingsStore));
  }

  onMount(async () => {
    await aiTutorApi.fetchOrgSettings();
    applyOrgSettings(aiTutorApi.orgSettings ?? defaultAiTutorSettings);
    captureSavedSnapshot();
    initialized = true;
  });

  async function handleSave() {
    await aiTutorApi.updateOrgSettings(get(orgTutorSettingsStore));

    if (aiTutorApi.orgSettings) {
      captureSavedSnapshot();
    }
  }

  function handleDiscard() {
    if (!savedSettingsSnapshot) return;

    orgTutorSettingsStore.set(JSON.parse(savedSettingsSnapshot));
  }
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('aiTutor.page.org.title')}</Page.Title>
      <Page.Subtitle>{$t('aiTutor.page.org.description')}</Page.Subtitle>
    </Page.HeaderContent>
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

  <Page.SettingsActions
    hasChanges={hasUnsavedChanges}
    loading={aiTutorApi.saving}
    disabled={!initialized || aiTutorApi.saving}
    statusLabel={$t('common.unsaved_changes.label')}
    discardLabel={$t('common.discard')}
    saveLabel={$t('common.save_changes')}
    onSave={handleSave}
    onDiscard={handleDiscard}
  />
</Page.Root>
