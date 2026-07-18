<script lang="ts">
  import { untrack } from 'svelte';
  import get from 'lodash/get';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { InputField } from '@cio/ui/custom/input-field';
  import AIGenerateButton from '$features/agent/components/ai-generate-button.svelte';
  import UploadImage from '$features/ui/upload-image.svelte';
  import { uploadImage } from '$lib/utils/services/upload';
  import type { Course } from '$features/course/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { snackbar } from '$features/ui/snackbar/store';

  interface Props {
    course: Course;
    setter: (value: unknown, key: string) => void;
  }

  let { course = $bindable(), setter }: Props = $props();

  function readInstructorField(path: string, fallback = '') {
    const value = get(course, path);
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    return fallback;
  }

  let name = $state(readInstructorField('metadata.instructor.name', $currentOrg.name ?? ''));
  let role = $state(readInstructorField('metadata.instructor.role'));
  let imgUrl = $state(readInstructorField('metadata.instructor.imgUrl', $currentOrg.avatarUrl ?? ''));
  let description = $state(readInstructorField('metadata.instructor.description'));
  let courseNo = $state(
    get(course, 'metadata.instructor.coursesNo') ?? get(course, 'metadata.instructor.courseNo') ?? ''
  );
  let avatar: File | undefined = $state();
  let isUploading = $state(false);

  async function onAvatarChange(_avatar: File | undefined) {
    const courseId = untrack(() => course.id);
    if (!_avatar || !courseId) return;

    isUploading = true;

    try {
      imgUrl = await uploadImage(_avatar);
    } catch (error) {
      console.error('Failed to upload instructor avatar:', error);
      snackbar.error('snackbar.landing_page_settings.error.upload_failed');
    } finally {
      isUploading = false;
    }
  }

  $effect(() => {
    setter(
      {
        name,
        role,
        imgUrl,
        description,
        coursesNo: courseNo
      },
      'metadata.instructor'
    );
  });

  $effect(() => {
    onAvatarChange(avatar);
  });
</script>

<div class="mt-5 w-full">
  <label for="upload" class="font-bold">
    {$t('course.navItem.landing_page.editor.instructor_form.upload')}
  </label>
  <div class="flex w-full justify-center">
    <UploadImage bind:avatar src={imgUrl} bind:isUploading elevatedDialog />
  </div>
</div>

<InputField
  className="mt-5"
  labelClassName="font-bold"
  label={$t('course.navItem.landing_page.editor.instructor_form.name')}
  placeholder={$t('course.navItem.landing_page.editor.instructor_form.name_placeholder')}
  bind:value={name}
/>

<InputField
  className="mt-5"
  labelClassName="font-bold"
  label={$t('course.navItem.landing_page.editor.instructor_form.role')}
  placeholder="e.g Software developer"
  bind:value={role}
/>

<TextareaField
  label={$t('course.navItem.landing_page.editor.instructor_form.about')}
  placeholder={$t('course.navItem.landing_page.editor.instructor_form.about_placeholder')}
  rows={6}
  className="mt-5"
  labelClassName="font-bold"
  bind:value={description}
>
  {#snippet labelAction()}
    <AIGenerateButton
      courseId={course.id}
      context={`the instructor bio on the landing page${course.title ? ` for a course called "${course.title}"` : ''}${name ? `. The instructor's name is ${name}` : ''}`}
      onInsert={(text) => (description = text)}
    />
  {/snippet}
</TextareaField>

<InputField
  className="mt-5"
  labelClassName="font-bold"
  label={$t('course.navItem.landing_page.editor.instructor_form.total')}
  type="number"
  bind:value={courseNo}
/>
