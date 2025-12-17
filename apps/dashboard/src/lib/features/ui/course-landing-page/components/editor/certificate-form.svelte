<script lang="ts">
  import get from 'lodash/get';
  import { untrack } from 'svelte';
  import { Label } from '@cio/ui/base/label';
  import { Switch } from '@cio/ui/base/switch';

  import type { Course } from '$lib/utils/types';
  import { NAV_ITEM_KEY } from '../../constants';
  import { t } from '$lib/utils/functions/translations';
  import { uploadImage } from '$lib/utils/services/upload';

  import { UploadImage } from '$features/ui';

  interface Props {
    course: Course;
    setter: (value: any, key: string) => void;
  }

  let { course = $bindable(), setter }: Props = $props();

  let avatar: File | undefined = $state();
  let templateUrl = $derived(get(course, 'metadata.certificate.templateUrl', '/images/certificate-template.svg'));
  let isUploading = $state(false);

  let show = $derived(get(course, `metadata.sectionDisplay.${NAV_ITEM_KEY.CERTIFICATE}`) ?? true);

  async function onTemplateChange(_avatar: File | undefined) {
    untrack(async () => {
      if (!_avatar || !course.id) return;
      isUploading = true;

      const logo = await uploadImage(_avatar);

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

<div class="flex flex-col items-center">
  <div class="border-bottom-c mt-5">
    <p class="text-center font-bold">
      {$t('course.navItem.landing_page.editor.certificate_form.upload_template')}
    </p>
    <UploadImage bind:avatar src={templateUrl} shape="rounded-none" bind:isUploading />
  </div>

  <div class="mt-5 flex flex-col gap-2">
    <p class="font-semibold">
      {$t('course.navItem.landing_page.editor.display_section')}
    </p>

    <div class="flex items-center space-x-2">
      <Switch bind:checked={show} />
      <Label class="text-gray-600">
        {show ? $t('settings.landing_page.show_section') : $t('settings.landing_page.hide_section')}
      </Label>
    </div>
  </div>
</div>
