<script lang="ts">
  import get from 'lodash/get';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import { uploadAvatar } from '$lib/utils/services/courses';
  import type { Course } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    course: Course;
    setter: (value: any, key: string) => void;
  }

  let { course = $bindable(), setter }: Props = $props();

  let name = $state(get(course, 'metadata.instructor.name'));
  let role = $state(get(course, 'metadata.instructor.role'));
  let imgUrl = $state(get(course, 'metadata.instructor.imgUrl'));
  let description = $state(get(course, 'metadata.instructor.description'));
  let courseNo = $state(get(course, 'metadata.instructor.courseNo'));
  let avatar: string | undefined = $state();
  let isUploading = $state(false);

  async function onAvatarChange(_avatar: string | undefined) {
    if (!_avatar || !course.id) return;
    isUploading = true;
    const logo = await uploadAvatar(course.id, _avatar);

    if (!logo) return;

    imgUrl = logo;
    isUploading = false;
  }

  $effect(() => {
    setter(name, 'metadata.instructor.name');
  });
  $effect(() => {
    setter(role, 'metadata.instructor.role');
  });
  $effect(() => {
    setter(imgUrl, 'metadata.instructor.imgUrl');
  });
  $effect(() => {
    setter(description, 'metadata.instructor.description');
  });
  $effect(() => {
    setter(courseNo, 'metadata.instructor.courseNo');
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
    <UploadImage bind:avatar src={imgUrl} bind:isUploading />
  </div>
</div>

<TextField
  className="mt-5"
  labelClassName="font-bold"
  label={$t('course.navItem.landing_page.editor.instructor_form.name')}
  placeholder={$t('course.navItem.landing_page.editor.instructor_form.name_placeholder')}
  bind:value={name}
/>

<TextField
  className="mt-5"
  labelClassName="font-bold"
  label={$t('course.navItem.landing_page.editor.instructor_form.role')}
  placeholder="e.g Software developer"
  bind:value={role}
/>

<TextArea
  label={$t('course.navItem.landing_page.editor.instructor_form.about')}
  placeholder={$t('course.navItem.landing_page.editor.instructor_form.about_placeholder')}
  rows={6}
  className="mt-5"
  labelClassName="font-bold"
  bind:value={description}
/>

<TextField
  className="mt-5"
  labelClassName="font-bold"
  label={$t('course.navItem.landing_page.editor.instructor_form.total')}
  type="number"
  bind:value={courseNo}
/>
