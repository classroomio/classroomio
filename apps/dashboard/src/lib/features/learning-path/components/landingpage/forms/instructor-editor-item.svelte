<script lang="ts">
  import TrashIcon from '@lucide/svelte/icons/trash';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { UploadImage } from '$features/ui';
  import { uploadImage } from '$lib/utils/services/upload';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import type { TLandingPageInstructor } from '@cio/utils/validation/learning-path';

  interface Props {
    instructor: TLandingPageInstructor;
    onDelete: () => void;
    onCollapse: () => void;
    onChange: () => void;
  }

  let { instructor = $bindable(), onDelete, onCollapse, onChange }: Props = $props();

  let avatar = $state<File | undefined>();
  let isUploading = $state(false);

  async function onAvatarChange(file: File | undefined) {
    if (!file) return;

    isUploading = true;
    try {
      const url = await uploadImage(file);
      if (url) {
        instructor.imgUrl = url;
        onChange();
      }
    } catch (error) {
      console.error('Failed to upload instructor avatar:', error);
      snackbar.error('snackbar.landing_page_settings.error.upload_failed');
    } finally {
      isUploading = false;
    }
  }

  $effect(() => {
    onAvatarChange(avatar);
  });
</script>

<div class="w-full space-y-4 pt-2">
  <div class="flex w-full flex-col items-center">
    <label for="upload" class="text-sm font-bold">
      {$t('learningPath.landing.instructors.upload')}
    </label>
    <div class="flex w-full justify-center pt-2">
      <UploadImage bind:avatar src={instructor.imgUrl} bind:isUploading elevatedDialog />
    </div>
  </div>

  <InputField
    labelClassName="font-bold"
    label={$t('learningPath.landing.instructors.name')}
    placeholder={$t('learningPath.landing.instructors.name_placeholder')}
    bind:value={instructor.name}
    oninput={onChange}
  />

  <InputField
    labelClassName="font-bold"
    label={$t('learningPath.landing.instructors.role')}
    placeholder={$t('learningPath.landing.instructors.role_placeholder')}
    bind:value={instructor.role}
    oninput={onChange}
  />

  <TextareaField
    label={$t('learningPath.landing.instructors.about')}
    placeholder={$t('learningPath.landing.instructors.about_placeholder')}
    rows={5}
    labelClassName="font-bold"
    bind:value={instructor.description}
    oninput={onChange}
  />

  <InputField
    labelClassName="font-bold"
    label={$t('learningPath.landing.instructors.total')}
    type="number"
    bind:value={instructor.coursesNo}
    oninput={onChange}
  />

  <div class="flex items-center justify-between border-t pt-3">
    <IconButton onclick={onDelete} aria-label={$t('learningPath.landing.instructors.remove')}>
      <TrashIcon size={16} class="text-destructive" />
    </IconButton>
    <IconButton onclick={onCollapse} aria-label={$t('common.close')}>
      <ChevronUpIcon size={16} />
    </IconButton>
  </div>
</div>
