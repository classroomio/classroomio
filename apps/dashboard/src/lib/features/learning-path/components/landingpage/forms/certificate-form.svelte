<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { UploadImage } from '$features/ui';
  import { uploadImage } from '$lib/utils/services/upload';
  import { snackbar } from '$features/ui/snackbar/store';
  import { DisplaySectionToggle } from '$features/ui';
  import type { TLandingPage } from '@cio/utils/validation/learning-path';

  interface Props {
    landingPage: TLandingPage;
    onChange: (patch: Partial<TLandingPage>) => void;
  }

  let { landingPage, onChange }: Props = $props();

  let avatar = $state<File | undefined>();
  let templateUrl = $state(landingPage.certificateTemplateUrl || '/images/certificate-template.svg');
  let isUploading = $state(false);
  let show = $state(landingPage.showCertificate ?? true);

  $effect(() => {
    const next = landingPage.showCertificate ?? true;
    if (next !== show) show = next;
  });

  $effect(() => {
    const nextUrl = landingPage.certificateTemplateUrl || '/images/certificate-template.svg';
    if (nextUrl !== templateUrl && !isUploading) templateUrl = nextUrl;
  });

  async function onTemplateChange(file: File | undefined) {
    if (!file) return;
    isUploading = true;

    try {
      const uploaded = await uploadImage(file);
      if (uploaded) {
        templateUrl = uploaded;
        onChange({ certificateTemplateUrl: uploaded });
      }
    } catch (error) {
      console.error('Failed to upload certificate template:', error);
      snackbar.error('snackbar.landing_page_settings.error.upload_failed');
    } finally {
      isUploading = false;
    }
  }

  $effect(() => {
    onTemplateChange(avatar);
  });
</script>

<div class="flex flex-col items-center">
  <div class="mt-5 border-b">
    <p class="text-center font-bold">
      {$t('learningPath.landing.certificate.upload_template')}
    </p>
    <UploadImage bind:avatar src={templateUrl} shape="rounded-none" bind:isUploading elevatedDialog />
  </div>

  <DisplaySectionToggle
    {show}
    toggleId="show-certificate-toggle"
    onToggleShow={(checked) => {
      show = checked;
      onChange({ showCertificate: checked });
    }}
  />
</div>
