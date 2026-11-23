<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as Page from '@cio/ui/base/page';
  import * as Field from '@cio/ui/base/field';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { Button } from '@cio/ui/base/button';
  import { Switch } from '@cio/ui/base/switch';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath, isOrgAdmin } from '$lib/utils/store/org';
  import SettingsCard from '$features/ui/settings-card.svelte';
  import SettingsSeparator from '$features/ui/settings-separator.svelte';
  import UploadWidget from '$features/ui/upload-widget/upload-widget.svelte';
  import { handleOpenWidget } from '$features/ui/course-landing-page/store';
  import { learningPathApi } from '$features/learning-path/api/learning-path.svelte';
  import LearningPathConfirmDialog from '$features/learning-path/components/learning-path-confirm-dialog.svelte';
  import { LEARNING_PATH_STATUS_KEYS } from '$features/learning-path/utils/learning-path-utils';
  import type { LearningPathDetail, LearningPathStatus } from '$features/learning-path/utils/types';

  let { data } = $props();

  type Draft = {
    name: string;
    description: string;
    coverImage: string;
    sequentialUnlock: boolean;
    selfEnrollment: boolean;
    autoEnroll: boolean;
    status: LearningPathStatus;
  };

  function toDraft(path: LearningPathDetail): Draft {
    return {
      name: path.name,
      description: path.description ?? '',
      coverImage: path.coverImage ?? '',
      sequentialUnlock: path.sequentialUnlock,
      selfEnrollment: path.selfEnrollment,
      autoEnroll: path.autoEnroll,
      status: path.status
    };
  }

  const draft = $state<Draft>(toDraft(learningPathApi.path!));
  let showDeleteDialog = $state(false);

  const statuses: LearningPathStatus[] = ['ACTIVE', 'DRAFT', 'ARCHIVED'];
  const STATUS_DESCRIPTION_KEYS: Record<LearningPathStatus, string> = {
    ACTIVE: 'learning_paths.settings.status_active_description',
    DRAFT: 'learning_paths.settings.status_draft_description',
    ARCHIVED: 'learning_paths.settings.status_archived_description'
  };

  const saved = $derived(learningPathApi.path ? toDraft(learningPathApi.path) : null);
  const hasChanges = $derived(
    saved !== null && (Object.keys(draft) as (keyof Draft)[]).some((key) => draft[key] !== saved[key])
  );

  function resetDraft() {
    if (!learningPathApi.path) return;

    const next = toDraft(learningPathApi.path);
    draft.name = next.name;
    draft.description = next.description;
    draft.coverImage = next.coverImage;
    draft.sequentialUnlock = next.sequentialUnlock;
    draft.selfEnrollment = next.selfEnrollment;
    draft.autoEnroll = next.autoEnroll;
    draft.status = next.status;
  }

  async function handleSave() {
    const coverImage = draft.coverImage.trim() || null;
    const didSave = await learningPathApi.updatePath(data.pathId, {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      coverImage,
      sequentialUnlock: draft.sequentialUnlock,
      selfEnrollment: draft.selfEnrollment,
      autoEnroll: draft.autoEnroll,
      status: draft.status
    });

    if (didSave) resetDraft();
  }

  async function handleDelete() {
    const deleted = await learningPathApi.deletePath(data.pathId);
    if (deleted) await goto(resolve(`${$currentOrgPath}/paths`, {}));
  }
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-3xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('learning_paths.settings.heading')}</Page.Title>
      {#if !$isOrgAdmin}
        <Page.Subtitle>{$t('learning_paths.admin_only')}</Page.Subtitle>
      {/if}
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <fieldset disabled={!$isOrgAdmin} class="flex min-w-0 flex-col gap-8 pb-8">
        <SettingsCard title={$t('learning_paths.settings.general')}>
          <Field.Group>
            <Field.Field>
              <div class="flex flex-col items-start gap-4 sm:flex-row">
                {#if draft.coverImage}
                  <img src={draft.coverImage} alt="" class="h-[120px] w-[168px] rounded-md border object-cover" />
                {:else}
                  <div
                    class="ui:bg-muted ui:text-muted-foreground flex h-[120px] w-[168px] items-center justify-center rounded-md border"
                  >
                    <PathIcon size={28} />
                  </div>
                {/if}
                <div class="flex min-w-0 flex-1 flex-col gap-2">
                  <Field.Label>{$t('learning_paths.fields.cover_image')}</Field.Label>
                  <Field.Description>{$t('learning_paths.fields.cover_image_description')}</Field.Description>
                  <div class="flex items-center gap-2">
                    <Button variant="secondary" onclick={() => ($handleOpenWidget.open = true)}>
                      {$t('learning_paths.settings.replace_image')}
                    </Button>
                    {#if draft.coverImage}
                      <Button variant="outline" onclick={() => (draft.coverImage = '')}>
                        {$t('learning_paths.settings.remove_image')}
                      </Button>
                    {/if}
                  </div>
                </div>
              </div>
              {#if $handleOpenWidget.open}
                <UploadWidget bind:imageURL={draft.coverImage} />
              {/if}
            </Field.Field>

            <InputField
              label={$t('learning_paths.fields.name')}
              bind:value={draft.name}
              isRequired
              errorMessage={draft.name.trim() ? '' : $t('learning_paths.settings.name_required')}
              testId="learning-path-settings-name"
            />
            <TextareaField label={$t('learning_paths.fields.description')} bind:value={draft.description} rows={4} />
          </Field.Group>
        </SettingsCard>

        <SettingsCard title={$t('learning_paths.settings.enrollment')}>
          <Field.Group>
            <Field.Field orientation="horizontal">
              <Field.Content>
                <Field.Label for="self-enrollment">{$t('learning_paths.fields.self_enrollment')}</Field.Label>
                <Field.Description>{$t('learning_paths.fields.self_enrollment_description')}</Field.Description>
              </Field.Content>
              <Switch
                id="self-enrollment"
                checked={draft.selfEnrollment}
                onCheckedChange={(checked) => (draft.selfEnrollment = checked)}
              />
            </Field.Field>
            <SettingsSeparator />
            <Field.Field orientation="horizontal">
              <Field.Content>
                <Field.Label for="settings-sequential">{$t('learning_paths.fields.sequential_unlock')}</Field.Label>
                <Field.Description>{$t('learning_paths.fields.sequential_unlock_description')}</Field.Description>
              </Field.Content>
              <Switch
                id="settings-sequential"
                checked={draft.sequentialUnlock}
                onCheckedChange={(checked) => (draft.sequentialUnlock = checked)}
              />
            </Field.Field>
            <SettingsSeparator />
            <Field.Field orientation="horizontal">
              <Field.Content>
                <Field.Label for="auto-enroll">{$t('learning_paths.fields.auto_enroll')}</Field.Label>
                <Field.Description>{$t('learning_paths.fields.auto_enroll_description')}</Field.Description>
              </Field.Content>
              <Switch
                id="auto-enroll"
                checked={draft.autoEnroll}
                onCheckedChange={(checked) => (draft.autoEnroll = checked)}
              />
            </Field.Field>
          </Field.Group>
        </SettingsCard>

        <SettingsCard title={$t('learning_paths.settings.status')}>
          <RadioGroup.Root bind:value={draft.status} disabled={!$isOrgAdmin} class="flex flex-col gap-4">
            {#each statuses as status (status)}
              <Field.Field orientation="horizontal">
                <RadioGroup.Item value={status} id="status-{status}" />
                <Field.Content>
                  <Field.Label for="status-{status}">{$t(LEARNING_PATH_STATUS_KEYS[status])}</Field.Label>
                  <Field.Description>{$t(STATUS_DESCRIPTION_KEYS[status])}</Field.Description>
                </Field.Content>
              </Field.Field>
            {/each}
          </RadioGroup.Root>
        </SettingsCard>

        {#if $isOrgAdmin}
          <SettingsCard
            title={$t('learning_paths.settings.delete_title')}
            description={$t('learning_paths.settings.delete_description')}
          >
            <Button variant="destructive" onclick={() => (showDeleteDialog = true)}>
              {$t('learning_paths.settings.delete')}
            </Button>
          </SettingsCard>
        {/if}
      </fieldset>
    {/snippet}
  </Page.Body>
  <Page.SettingsActions
    hasChanges={hasChanges && $isOrgAdmin}
    loading={learningPathApi.isSaving}
    disabled={learningPathApi.isSaving || !draft.name.trim()}
    statusLabel={$t('common.unsaved_changes.label')}
    discardLabel={$t('common.discard')}
    saveLabel={$t('common.save_changes')}
    onSave={handleSave}
    onDiscard={resetDraft}
  />
</Page.Root>

<LearningPathConfirmDialog
  bind:open={showDeleteDialog}
  title={$t('learning_paths.settings.delete_title')}
  description={$t('learning_paths.settings.delete_confirm')}
  confirmLabel={$t('learning_paths.settings.delete')}
  destructive
  onConfirm={handleDelete}
/>
