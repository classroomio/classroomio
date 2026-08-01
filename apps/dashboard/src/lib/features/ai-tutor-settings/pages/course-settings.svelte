<script lang="ts">
  import { onMount } from 'svelte';
  import { writable, get } from 'svelte/store';

  import { defaultAiTutorSettings, type AiTutorSettings } from '@cio/ai-assistant/tutor-config';

  import * as Page from '@cio/ui/base/page';
  import * as Field from '@cio/ui/base/field';
  import { Switch } from '@cio/ui/base/switch';
  import { Label } from '@cio/ui/base/label';
  import { t } from '$lib/utils/functions/translations';
  import { aiTutorApi } from '../api/ai-tutor.svelte';
  import TutorSettingsForm from '../components/tutor-settings-form.svelte';

  interface Props {
    courseId: string;
  }

  let { courseId }: Props = $props();

  const formStore = writable<AiTutorSettings>({ ...defaultAiTutorSettings });
  let inheritFromOrg = $state(true);
  let initialized = $state(false);
  let savedStateSnapshot = $state('');
  let formSettings = $state<AiTutorSettings>({ ...defaultAiTutorSettings });

  $effect(() => {
    const unsubscribe = formStore.subscribe((value) => {
      formSettings = value;
    });

    return unsubscribe;
  });

  function getCurrentStateSnapshot() {
    return JSON.stringify({
      inheritFromOrg,
      settings: formSettings
    });
  }

  const hasUnsavedChanges = $derived(
    initialized && savedStateSnapshot !== '' && getCurrentStateSnapshot() !== savedStateSnapshot
  );

  function captureSavedSnapshot() {
    savedStateSnapshot = getCurrentStateSnapshot();
  }

  onMount(async () => {
    await aiTutorApi.fetchCourseSettings(courseId);
    const view = aiTutorApi.courseSettings;

    if (view) {
      formStore.set(view.effective ?? defaultAiTutorSettings);
      inheritFromOrg = view.override == null || view.override.inheritFromOrg !== false;
    }

    captureSavedSnapshot();
    initialized = true;
  });

  async function handleSave() {
    if (inheritFromOrg) {
      await aiTutorApi.updateCourseSettings(courseId, { inheritFromOrg: true });
    } else {
      const data = get(formStore);
      await aiTutorApi.updateCourseSettings(courseId, { ...data, inheritFromOrg: false });
    }

    if (aiTutorApi.courseSettings) {
      captureSavedSnapshot();
    }
  }

  function handleDiscard() {
    if (!savedStateSnapshot) return;

    const parsed = JSON.parse(savedStateSnapshot) as {
      inheritFromOrg: boolean;
      settings: AiTutorSettings;
    };

    inheritFromOrg = parsed.inheritFromOrg;
    formStore.set(parsed.settings);
  }
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('aiTutor.page.course.title')}</Page.Title>
      <Page.Subtitle>{$t('aiTutor.page.course.description')}</Page.Subtitle>
    </Page.HeaderContent>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      {#if !initialized}
        <p class="ui:text-muted-foreground text-sm">{$t('aiTutor.state.loading')}</p>
      {:else}
        <Field.Group>
          <Field.Set>
            <Field.Legend>{$t('aiTutor.section.inheritance')}</Field.Legend>
            <Field.Description>{$t('aiTutor.section.inheritance_description')}</Field.Description>

            <Field.Field orientation="horizontal">
              <Switch bind:checked={inheritFromOrg} />
              <Label>{$t('aiTutor.field.inheritFromOrg')}</Label>
            </Field.Field>
          </Field.Set>

          {#if !inheritFromOrg}
            <Field.Separator />
            <TutorSettingsForm store={formStore} disabled={aiTutorApi.saving} />
          {/if}
        </Field.Group>
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
