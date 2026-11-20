<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import { Switch } from '@cio/ui/base/switch';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { UploadImage } from '$features/ui';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { uploadImage } from '$lib/utils/services/upload';
  import { DEFAULT_CERTIFICATE_ID_FORMAT } from '@cio/utils/functions';
  import type { ParameterizedCertificateEditorStore } from '../store/certificate-editor-store.svelte';

  interface Props {
    store: ParameterizedCertificateEditorStore;
    disabled?: boolean;
  }

  let { store, disabled = false }: Props = $props();

  let signatoryOneAvatar: File | undefined = $state();
  let signatoryTwoAvatar: File | undefined = $state();
  let signatoryOnePreview = $state('');
  let signatoryTwoPreview = $state('');
  let isSignatoryOneUploading = $state(false);
  let isSignatoryTwoUploading = $state(false);

  $effect(() => {
    if (isSignatoryOneUploading) return;

    signatoryOnePreview = store.draft.signatories?.[0]?.signatureUrl ?? '';
  });

  $effect(() => {
    if (isSignatoryTwoUploading) return;

    signatoryTwoPreview = store.draft.signatories?.[1]?.signatureUrl ?? '';
  });

  async function uploadSignatorySignature(index: 0 | 1, avatar: File) {
    if (index === 0) {
      isSignatoryOneUploading = true;
    } else {
      isSignatoryTwoUploading = true;
    }

    store.beginSignatureUpload();

    try {
      const signatureUrl = await uploadImage(avatar);
      store.setSignatorySignatureUrl(index, signatureUrl);

      if (index === 0) {
        signatoryOnePreview = signatureUrl;
        signatoryOneAvatar = undefined;
      } else {
        signatoryTwoPreview = signatureUrl;
        signatoryTwoAvatar = undefined;
      }
    } catch (error) {
      console.error('Error uploading signature image:', error);
      snackbar.error('snackbar.landing_page_settings.error.try_again');
    } finally {
      if (index === 0) {
        isSignatoryOneUploading = false;
      } else {
        isSignatoryTwoUploading = false;
      }

      store.endSignatureUpload();
    }
  }

  $effect(() => {
    const avatar = signatoryOneAvatar;
    if (!avatar || isSignatoryOneUploading) return;

    void uploadSignatorySignature(0, avatar);
  });

  $effect(() => {
    const avatar = signatoryTwoAvatar;
    if (!avatar || isSignatoryTwoUploading) return;

    void uploadSignatorySignature(1, avatar);
  });
</script>

<Field.Group>
  <Field.Set>
    <Field.Legend>{$t('certificate.editor.section_header')}</Field.Legend>
    <Field.Group>
      <Field.Field>
        <InputField
          label={$t('certificate.editor.subtitle')}
          bind:value={store.draft.subtitle}
          placeholder={$t('certificate.editor.subtitle_placeholder')}
          isDisabled={disabled}
        />
      </Field.Field>
      <Field.Field>
        <TextareaField
          label={$t('certificate.editor.description_override')}
          rows={4}
          bind:value={store.draft.descriptionOverride}
          placeholder={$t('certificate.editor.description_override_placeholder')}
          {disabled}
        />
        <Field.Description>
          {$t('certificate.editor.description_override_hint')}
        </Field.Description>
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('certificate.editor.section_signatories')}</Field.Legend>
    <Field.Group>
      <Field.Set>
        <Field.Field orientation="horizontal">
          <Switch bind:checked={store.draft.signatories[0].enabled} {disabled} />
          <Field.Label>{$t('certificate.editor.signatory_one_toggle')}</Field.Label>
        </Field.Field>

        {#if store.draft.signatories[0].enabled}
          <Field.Group>
            <Field.Field>
              <InputField
                label={$t('certificate.editor.signatory_one_name')}
                bind:value={store.draft.signatories[0].name}
                isDisabled={disabled}
              />
            </Field.Field>
            <Field.Field>
              <InputField
                label={$t('certificate.editor.signatory_one_role')}
                bind:value={store.draft.signatories[0].role}
                isDisabled={disabled}
              />
            </Field.Field>
            <Field.Field>
              <Field.Label>{$t('certificate.editor.signature_upload')}</Field.Label>
              <UploadImage
                bind:avatar={signatoryOneAvatar}
                bind:src={signatoryOnePreview}
                shape="rounded"
                widthHeight="h-[56px] w-[120px]"
                previewVariant="signature"
                isDisabled={disabled}
                bind:isUploading={isSignatoryOneUploading}
              />
              <Field.Description>
                {$t('certificate.editor.signature_upload_hint')}
              </Field.Description>
            </Field.Field>
          </Field.Group>
        {/if}
      </Field.Set>

      <Field.Separator />

      <Field.Set>
        <Field.Field orientation="horizontal">
          <Switch bind:checked={store.draft.signatories[1].enabled} {disabled} />
          <Field.Label>{$t('certificate.editor.signatory_two_toggle')}</Field.Label>
        </Field.Field>

        {#if store.draft.signatories[1].enabled}
          <Field.Group>
            <Field.Field>
              <InputField
                label={$t('certificate.editor.signatory_two_name')}
                bind:value={store.draft.signatories[1].name}
                isDisabled={disabled}
              />
            </Field.Field>
            <Field.Field>
              <InputField
                label={$t('certificate.editor.signatory_two_role')}
                bind:value={store.draft.signatories[1].role}
                isDisabled={disabled}
              />
            </Field.Field>
            <Field.Field>
              <Field.Label>{$t('certificate.editor.signature_upload')}</Field.Label>
              <UploadImage
                bind:avatar={signatoryTwoAvatar}
                bind:src={signatoryTwoPreview}
                shape="rounded"
                widthHeight="h-[56px] w-[120px]"
                previewVariant="signature"
                isDisabled={disabled}
                bind:isUploading={isSignatoryTwoUploading}
              />
              <Field.Description>
                {$t('certificate.editor.signature_upload_hint')}
              </Field.Description>
            </Field.Field>
          </Field.Group>
        {/if}
      </Field.Set>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('certificate.editor.section_reference')}</Field.Legend>
    <Field.Field>
      <InputField
        label={$t('certificate.editor.id_format')}
        bind:value={store.draft.idFormat}
        placeholder={DEFAULT_CERTIFICATE_ID_FORMAT}
        isDisabled={disabled}
      />
      <Field.Description>
        {$t('certificate.editor.id_format_hint')}
      </Field.Description>
    </Field.Field>
  </Field.Set>
</Field.Group>
