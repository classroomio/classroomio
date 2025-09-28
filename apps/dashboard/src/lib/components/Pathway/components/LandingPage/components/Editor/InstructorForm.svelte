<script lang="ts">
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import get from 'lodash/get';
  import isEmpty from 'lodash/isEmpty';

  import type { Pathway } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { uploadAvatar } from '$lib/utils/services/pathways';

  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import UploadImage from '$lib/components/UploadImage/index.svelte';

  export let pathway: Pathway;
  let name: string | undefined;
  let role: string | undefined;
  let imgUrl: string | undefined;
  let description: string | undefined;
  let pathwayNo: number | undefined;
  let avatar: string | undefined;
  let hasBeenSet = false;

  function setter(value: any, setterKey: string) {
    if (!value) return;

    const _pathway = cloneDeep(pathway);
    set(_pathway, setterKey, value);

    pathway = _pathway;
  }

  async function onAvatarChange(_avatar: string | undefined) {
    if (!_avatar || !pathway.id) return;

    const logo = await uploadAvatar(pathway.id, _avatar);

    if (!logo) return;

    imgUrl = logo;
  }

  function setDefaults(pathway: Pathway) {
    if (isEmpty(pathway) || hasBeenSet) return;

    hasBeenSet = true;
    name = get(pathway, 'landingpage.instructor.name');
    role = get(pathway, 'landingpage.instructor.role');
    imgUrl = get(pathway, 'landingpage.instructor.imgUrl');
    description = get(pathway, 'landingpage.instructor.description');
    pathwayNo = get(pathway, 'landingpage.instructor.coursesNo');
  }

  $: setter(name, 'landingpage.instructor.name');
  $: setter(role, 'landingpage.instructor.role');
  $: setter(imgUrl, 'landingpage.instructor.imgUrl');
  $: setter(description, 'landingpage.instructor.description');
  $: setter(pathwayNo, 'landingpage.instructor.coursesNo');

  $: onAvatarChange(avatar);

  $: setDefaults(pathway);
</script>

<div class="mt-5">
  <label for="upload" class="font-bold"
    >{$t('course.navItem.landing_page.editor.instructor_form.upload')}</label
  >
  <UploadImage bind:avatar src={imgUrl} />
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
  bind:value={pathwayNo}
/>
