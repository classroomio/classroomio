<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  import { defaultAiTutorSettings, type AiTutorSettings } from '@cio/ai-assistant/tutor-config';

  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
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

  onMount(async () => {
    await aiTutorApi.fetchCourseSettings(courseId);
    const view = aiTutorApi.courseSettings;

    if (view) {
      formStore.set(view.effective ?? defaultAiTutorSettings);
      inheritFromOrg = view.override == null || view.override.inheritFromOrg !== false;
    }

    initialized = true;
  });

  async function handleSave() {
    if (inheritFromOrg) {
      await aiTutorApi.updateCourseSettings(courseId, { inheritFromOrg: true });
      return;
    }

    const data = $formStore;
    await aiTutorApi.updateCourseSettings(courseId, { ...data, inheritFromOrg: false });
  }
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
  <Page.Header isSticky class="ui:bg-background z-10">
    <Page.HeaderContent>
      <Page.Title>{$t('aiTutor.page.course.title')}</Page.Title>
      <Page.Subtitle>{$t('aiTutor.page.course.description')}</Page.Subtitle>
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
</Page.Root>
