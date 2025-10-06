<script lang="ts">
  import get from 'lodash/get';
  import { Toggle } from 'carbon-components-svelte';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import { uploadAvatar } from '$lib/utils/services/courses';
  import type { Course } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { NAV_ITEM_KEY } from '../../constants';
  import { untrack } from 'svelte';

  interface Props {
    course: Course;
    setter: (value: any, key: string) => void;
  }

  let { course = $bindable(), setter }: Props = $props();

  let avatar: string | undefined = $state();
  let templateUrl = $derived(
    get(course, 'metadata.certificate.templateUrl', '/images/certificate-template.svg')
  );
  let isUploading = $state(false);

  let show = $derived(get(course, `metadata.sectionDisplay.${NAV_ITEM_KEY.CERTIFICATE}`) ?? true);

  async function onTemplateChange(_avatar: string | undefined) {
    untrack(async () => {
      if (!_avatar || !course.id) return;
      isUploading = true;

      const logo = await uploadAvatar(course.id, _avatar);

      if (logo) {
        templateUrl = logo;
        setter(templateUrl, 'metadata.certificate.templateUrl');
      }

      isUploading = false;
    });
  }

  $effect(() => {
    onTemplateChange(avatar);
  });
  $effect(() => {
    setter(show, `metadata.sectionDisplay.${NAV_ITEM_KEY.CERTIFICATE}`);
  });
</script>

<div class="border-bottom-c mt-5">
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
