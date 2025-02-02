<script lang="ts">
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import get from 'lodash/get';
  import isEmpty from 'lodash/isEmpty';
  import { Toggle } from 'carbon-components-svelte';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import { uploadAvatar } from '$lib/utils/services/courses';
  import type { Course } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { NAV_ITEM_KEY } from '../../constants';

  export let course: Course;

  let avatar: string | undefined;
  let show: boolean;
  let templateUrl: string | undefined;
  let hasBeenSet = false;
  let isUploading = false;

  function setter(value: any, setterKey: string) {
    if (typeof value === 'undefined') return;

    const _course = cloneDeep(course);
    set(_course, setterKey, value);

    course = _course;
  }

  async function onTemplateChange(_avatar: string | undefined) {
    if (!_avatar || !course.id) return;
    isUploading = true;

    const logo = await uploadAvatar(course.id, _avatar);

    if (logo) {
      templateUrl = logo;

      setter(templateUrl, 'metadata.certificate.templateUrl');
    }

    isUploading = false;
  }

  function setDefaults(course: Course) {
    if (isEmpty(course) || hasBeenSet) return;

    hasBeenSet = true;

    show = get(course, `metadata.sectionDisplay.${NAV_ITEM_KEY.CERTIFICATE}`) ?? true;
    templateUrl = get(
      course,
      'metadata.certificate.templateUrl',
      '/images/certificate-template.svg'
    );
  }

  $: onTemplateChange(avatar);
  $: setter(show, `metadata.sectionDisplay.${NAV_ITEM_KEY.CERTIFICATE}`);

  $: setDefaults(course);
</script>

<div class="mt-5 border-bottom-c">
  <p class="font-bold">
    {$t('course.navItem.landing_page.editor.certificate_form.upload_template')}
  </p>
  <UploadImage bind:avatar src={templateUrl} shape="rounded-none" bind:isUploading />
</div>

<div class="mt-5">
  <p class="font-bold">
    {$t('course.navItem.landing_page.editor.display_section')}
  </p>

  <Toggle bind:toggled={show} size="sm">
    <span slot="labelA" style="color: gray">{$t('settings.landing_page.hide_section')}</span>
    <span slot="labelB" style="color: gray">{$t('settings.landing_page.show_section')}</span>
  </Toggle>
</div>
