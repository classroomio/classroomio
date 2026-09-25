<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Switch } from '@cio/ui/base/switch';
  import { Label } from '@cio/ui/base/label';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import Copy from '@lucide/svelte/icons/copy';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { DeleteModal, UploadWidget, TextEditor } from '$features/ui';
  import { handleOpenWidget } from '$features/ui/course-landing-page/store';
  import { copyToClipboard } from '$lib/utils/functions/formatYoutubeVideo';
  import { generateSlug } from '@cio/utils/functions';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgDomain, currentOrgPath, isOrgAdmin } from '$lib/utils/store/org';
  import { learningPathApi } from '../../api';
  import type { LearningPathDetail, UpdateLearningPathInput } from '../../utils/types';

  interface Props {
    path: LearningPathDetail;
    hasUnsavedChanges?: boolean;
  }

  let { path, hasUnsavedChanges = $bindable(false) }: Props = $props();

  let name = $state(path.name);
  let description = $state(path.description);
  let coverImage = $state(path.coverImage ?? '');
  let welcomeEmailMessage = $state(path.welcomeEmailMessage ?? '');
  let currentSlug = $state(path.slug ?? '');
  let selfEnrollment = $state(path.selfEnrollment ?? true);
  let sequentialUnlock = $state(path.sequentialUnlock ?? true);
  let autoEnroll = $state(path.autoEnroll ?? true);
  let isPublished = $state(path.isPublished ?? false);

  let currentPathId = $state(path.id);
  let isGeneratingLink = $state(false);
  let isDeleting = $state(false);
  let deleteModalOpen = $state(false);

  let errors = $state<{
    name?: string;
    description?: string;
  }>({});

  let snapshot = $state({
    name: path.name,
    description: path.description,
    coverImage: path.coverImage ?? '',
    welcomeEmailMessage: path.welcomeEmailMessage ?? '',
    slug: path.slug ?? '',
    selfEnrollment: path.selfEnrollment ?? true,
    sequentialUnlock: path.sequentialUnlock ?? true,
    autoEnroll: path.autoEnroll ?? true,
    isPublished: path.isPublished ?? false
  });

  $effect(() => {
    if (path.id !== currentPathId) {
      currentPathId = path.id;
      name = path.name;
      description = path.description;
      coverImage = path.coverImage ?? '';
      welcomeEmailMessage = path.welcomeEmailMessage ?? '';
      currentSlug = path.slug ?? '';
      selfEnrollment = path.selfEnrollment ?? true;
      sequentialUnlock = path.sequentialUnlock ?? true;
      autoEnroll = path.autoEnroll ?? true;
      isPublished = path.isPublished ?? false;

      snapshot = {
        name: path.name,
        description: path.description,
        coverImage: path.coverImage ?? '',
        welcomeEmailMessage: path.welcomeEmailMessage ?? '',
        slug: path.slug ?? '',
        selfEnrollment: path.selfEnrollment ?? true,
        sequentialUnlock: path.sequentialUnlock ?? true,
        autoEnroll: path.autoEnroll ?? true,
        isPublished: path.isPublished ?? false
      };
      errors = {};
      hasUnsavedChanges = false;
    }
  });

  // eslint-disable-next-line svelte/prefer-writable-derived -- must stay writable: bound to parent via bind:hasUnsavedChanges
  $effect(() => {
    const isDirty =
      name !== snapshot.name ||
      description !== snapshot.description ||
      coverImage !== snapshot.coverImage ||
      welcomeEmailMessage !== snapshot.welcomeEmailMessage ||
      currentSlug !== snapshot.slug ||
      selfEnrollment !== snapshot.selfEnrollment ||
      sequentialUnlock !== snapshot.sequentialUnlock ||
      autoEnroll !== snapshot.autoEnroll ||
      isPublished !== snapshot.isPublished;

    hasUnsavedChanges = isDirty;
  });

  const pathLink = $derived(currentSlug ? `${$currentOrgDomain}/path/${currentSlug}` : '#');

  const PEOPLE_LINK_MARKER = '@@people@@';

  const peoplePageHref = $derived(path.publicId ? resolve(`/paths/${path.publicId}/people`, {}) : '#');

  const selfEnrollmentAccessParts = $derived.by(() => {
    const accessText = $t('learningPath.settings.self_enrollment.access', { people: PEOPLE_LINK_MARKER });
    const [before = '', after = ''] = accessText.split(PEOPLE_LINK_MARKER);

    return { before, after };
  });

  async function generateNewPathLink() {
    if (!path || isGeneratingLink) return;

    isGeneratingLink = true;
    try {
      const generatedSlug = generateSlug(name || path.name, { appendTimestamp: true });
      const pathPublicId = path.publicId ?? path.id;
      const response = await learningPathApi.update(pathPublicId, { slug: generatedSlug }, { showSuccessToast: false });

      if (learningPathApi.success && response) {
        currentSlug = response.slug ?? generatedSlug;
        snapshot.slug = currentSlug;
        snackbar.success('learningPath.snackbar.link_generated');
      }
    } catch (error) {
      console.error(error);
      snackbar.error();
    } finally {
      isGeneratingLink = false;
    }
  }

  function handleOpenUploadWidget() {
    $handleOpenWidget.open = true;
  }

  function handleResetCover() {
    coverImage = '';
    hasUnsavedChanges = true;
  }

  export async function handleSave() {
    errors = {};

    if (!name.trim()) {
      errors.name = $t('learningPath.settings.general.name_required');
      return;
    }

    if (!description.trim()) {
      errors.description = $t('learningPath.settings.general.description_required');
      return;
    }

    const pathPublicId = path.publicId ?? path.id;
    let targetSlug = currentSlug;

    if (isPublished && !targetSlug) {
      targetSlug = generateSlug(name.trim(), { appendTimestamp: true });
      currentSlug = targetSlug;
    }

    const payload: UpdateLearningPathInput = {
      name: name.trim(),
      description: description.trim(),
      coverImage: coverImage ? coverImage.trim() : null,
      welcomeEmailMessage: welcomeEmailMessage?.trim() ? welcomeEmailMessage : null,
      slug: targetSlug ? targetSlug.trim() : undefined,
      selfEnrollment,
      sequentialUnlock,
      autoEnroll,
      isPublished
    };

    const updated = await learningPathApi.update(pathPublicId, payload, { showSuccessToast: false });
    if (!updated) {
      return;
    }

    snackbar.success('learningPath.snackbar.settings_saved');

    snapshot = {
      name: updated.name,
      description: updated.description,
      coverImage: updated.coverImage ?? '',
      welcomeEmailMessage: updated.welcomeEmailMessage ?? '',
      slug: updated.slug ?? targetSlug,
      selfEnrollment: updated.selfEnrollment,
      sequentialUnlock: updated.sequentialUnlock,
      autoEnroll: updated.autoEnroll,
      isPublished: updated.isPublished
    };

    hasUnsavedChanges = false;
  }

  export function handleDiscard() {
    name = snapshot.name;
    description = snapshot.description;
    coverImage = snapshot.coverImage;
    welcomeEmailMessage = snapshot.welcomeEmailMessage;
    currentSlug = snapshot.slug;
    selfEnrollment = snapshot.selfEnrollment;
    sequentialUnlock = snapshot.sequentialUnlock;
    autoEnroll = snapshot.autoEnroll;
    isPublished = snapshot.isPublished;
    errors = {};
    hasUnsavedChanges = false;
  }

  async function handleDeletePath() {
    isDeleting = true;

    try {
      await learningPathApi.delete(path.publicId ?? path.id);
      if (learningPathApi.success) {
        goto(resolve(`${$currentOrgPath}/paths`, {}));
      }
    } catch (err) {
      console.error('Failed to delete learning path:', err);
      snackbar.error();
    } finally {
      deleteModalOpen = false;
      isDeleting = false;
    }
  }
</script>

<DeleteModal
  bind:open={deleteModalOpen}
  onDelete={handleDeletePath}
  isLoading={isDeleting}
  title={$t('learningPath.settings.danger.delete_title')}
  description={$t('learningPath.settings.danger.delete_description', { name: path.name })}
/>

<Field.Group class="w-full max-w-md! px-2">
  <Field.Set>
    <Field.Legend>{$t('learningPath.settings.cover_image.legend')}</Field.Legend>
    <Field.Description>{$t('learningPath.settings.cover_image.desc')}</Field.Description>
    <Field.Group>
      <Field.Field>
        <div class="flex items-center gap-2">
          <Button variant="secondary" onclick={handleOpenUploadWidget}>
            {$t('learningPath.settings.cover_image.replace')}
          </Button>
          <Button variant="outline" onclick={handleResetCover}>
            {$t('learningPath.settings.cover_image.reset')}
          </Button>
        </div>
        {#if $handleOpenWidget.open}
          <UploadWidget
            bind:imageURL={coverImage}
            onchange={() => {
              hasUnsavedChanges = true;
            }}
          />
        {/if}
      </Field.Field>
      <Field.Field>
        <div class="relative w-fit">
          <img
            alt={$t('learningPath.settings.cover_image.alt')}
            src={coverImage || '/images/classroomio-course-img-template.jpg'}
            class="relative mt-2 h-[200px] w-[280px] rounded-md border object-cover md:mt-0"
          />
        </div>
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set id="share">
    <Field.Legend>{$t('learningPath.settings.general.legend')}</Field.Legend>
    <Field.Group>
      <Field.Field>
        <InputField
          label={$t('learningPath.settings.general.name_label')}
          placeholder={$t('learningPath.settings.general.name_placeholder')}
          className="w-full"
          isRequired
          bind:value={name}
          errorMessage={errors.name}
          onInputChange={() => {
            hasUnsavedChanges = true;
          }}
        />
      </Field.Field>

      <Field.Field>
        <TextareaField
          label={$t('learningPath.settings.general.description_label')}
          placeholder={$t('learningPath.settings.general.description_placeholder')}
          className="w-full"
          isRequired
          bind:value={description}
          errorMessage={errors.description}
          onchange={() => {
            hasUnsavedChanges = true;
          }}
        />
      </Field.Field>

      <Field.Field>
        <Field.Label class="justify-between">
          {$t('learningPath.settings.general.link')}

          <div class="flex items-center gap-1">
            <IconButton
              onclick={generateNewPathLink}
              loading={isGeneratingLink}
              tooltip={$t('learningPath.settings.general.generate_link')}
            >
              <RotateCcwIcon size={16} />
            </IconButton>
            <IconButton
              href={pathLink}
              target="_blank"
              disabled={isGeneratingLink || !path.slug}
              tooltip={$t('learningPath.settings.general.open_link')}
            >
              <ArrowUpRightIcon size={16} />
            </IconButton>
          </div>
        </Field.Label>

        <div class="flex items-center justify-between rounded-md border p-1">
          {#if currentSlug}
            <p class="text-sm">{pathLink}</p>
            <IconButton
              onclick={() => {
                copyToClipboard(pathLink);
              }}
              disabled={isGeneratingLink}
              tooltip={$t('learningPath.settings.general.copy_link')}
            >
              <Copy size={16} />
            </IconButton>
          {:else}
            <p class="text-sm">{$t('learningPath.settings.general.setup_landing_for_link')}</p>
          {/if}
        </div>
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('learningPath.settings.welcome_email.legend')}</Field.Legend>
    <Field.Description>{$t('learningPath.settings.welcome_email.desc')}</Field.Description>
    <div class="w-full max-w-md">
      <TextEditor
        content={welcomeEmailMessage}
        placeholder={$t('learningPath.settings.welcome_email.placeholder')}
        class="w-full"
        editorClass="h-auto! max-h-[200px] min-h-[120px]"
        onChange={(text) => {
          welcomeEmailMessage = text;
          hasUnsavedChanges = true;
        }}
      />
    </div>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('learningPath.settings.progression.legend')}</Field.Legend>
    <Field.Description>{$t('learningPath.settings.progression.desc')}</Field.Description>
    <Field.Field>
      <RadioGroup.Root
        value={sequentialUnlock ? 'sequential' : 'free'}
        onValueChange={(val) => {
          sequentialUnlock = val === 'sequential';
          hasUnsavedChanges = true;
        }}
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <RadioGroup.Item value="free" id="progression-free" />
            <Label for="progression-free">{$t('learningPath.settings.progression.free')}</Label>
          </div>
          <div class="flex items-center gap-2">
            <RadioGroup.Item value="sequential" id="progression-sequential" />
            <Label for="progression-sequential">{$t('learningPath.settings.progression.sequential')}</Label>
          </div>
        </div>
      </RadioGroup.Root>
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('learningPath.settings.self_enrollment.legend')}</Field.Legend>
    <Field.Description>
      {selfEnrollmentAccessParts.before}<a
        href={peoplePageHref}
        data-testid="path-settings-people-link"
        class="ui:text-primary">{$t('learningPath.settings.self_enrollment.access_people')}</a
      >{selfEnrollmentAccessParts.after}
    </Field.Description>
    <Field.Field orientation="horizontal">
      <Switch
        id="self-enrollment-switch"
        checked={selfEnrollment}
        onCheckedChange={(checked) => {
          selfEnrollment = checked;
          hasUnsavedChanges = true;
        }}
      />
      <Label for="self-enrollment-switch">
        {selfEnrollment
          ? $t('learningPath.settings.self_enrollment.enabled')
          : $t('learningPath.settings.self_enrollment.disabled')}
      </Label>
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('learningPath.settings.auto_enroll.legend')}</Field.Legend>
    <Field.Description>{$t('learningPath.settings.auto_enroll.desc')}</Field.Description>
    <Field.Field orientation="horizontal">
      <Switch
        id="auto-enroll-switch"
        checked={autoEnroll}
        onCheckedChange={(checked) => {
          autoEnroll = checked;
          hasUnsavedChanges = true;
        }}
      />
      <Label for="auto-enroll-switch">
        {autoEnroll
          ? $t('learningPath.settings.auto_enroll.enabled')
          : $t('learningPath.settings.auto_enroll.disabled')}
      </Label>
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set id="publish">
    <Field.Legend>{$t('learningPath.settings.publishing.legend')}</Field.Legend>
    <Field.Description>{$t('learningPath.settings.publishing.desc')}</Field.Description>
    <Field.Field orientation="horizontal">
      <Switch
        id="publish-path-switch"
        checked={isPublished}
        onCheckedChange={(checked) => {
          isPublished = checked;
          hasUnsavedChanges = true;
        }}
      />
      <Label for="publish-path-switch">
        {isPublished
          ? $t('learningPath.settings.publishing.published')
          : $t('learningPath.settings.publishing.unpublished')}
      </Label>
    </Field.Field>
  </Field.Set>

  {#if $isOrgAdmin}
    <Field.Separator />

    <Field.Set id="delete">
      <Field.Legend>{$t('learningPath.settings.danger.legend')}</Field.Legend>
      <Field.Description>{$t('learningPath.settings.danger.desc')}</Field.Description>
      <Field.Field>
        <Button
          variant="destructive"
          onclick={() => (deleteModalOpen = true)}
          loading={isDeleting}
          disabled={isDeleting}
          class="w-fit!"
        >
          {$t('learningPath.settings.danger.delete_button')}
        </Button>
      </Field.Field>
    </Field.Set>
  {/if}
</Field.Group>
