<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import { Switch } from '@cio/ui/base/switch';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { UploadImage } from '$features/ui';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { uploadImage } from '$lib/utils/services/upload';
  import { certificateEditorStore } from '../store/certificate-editor.store.svelte';

  interface Props {
    disabled?: boolean;
  }

  let { disabled = false }: Props = $props();

  let signatoryOneAvatar: File | undefined = $state();
  let signatoryTwoAvatar: File | undefined = $state();
  let signatoryOnePreview = $state('');
  let signatoryTwoPreview = $state('');
  let isSignatoryOneUploading = $state(false);
  let isSignatoryTwoUploading = $state(false);

  $effect(() => {
    certificateEditorStore.isSignatureUploading = isSignatoryOneUploading || isSignatoryTwoUploading;
  });

  $effect(() => {
    if (isSignatoryOneUploading) return;

    signatoryOnePreview = certificateEditorStore.draft.signatories[0].signatureUrl;
  });

  $effect(() => {
    if (isSignatoryTwoUploading) return;

    signatoryTwoPreview = certificateEditorStore.draft.signatories[1].signatureUrl;
  });

  async function uploadSignatorySignature(index: 0 | 1, avatar: File) {
    if (index === 0) {
      isSignatoryOneUploading = true;
    } else {
      isSignatoryTwoUploading = true;
    }

    try {
      const signatureUrl = await uploadImage(avatar);
      certificateEditorStore.setSignatorySignatureUrl(index, signatureUrl);

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
    <Field.Legend>{$t('course.navItem.certificates.editor.section_header')}</Field.Legend>
    <Field.Group>
      <Field.Field>
        <InputField
          label={$t('course.navItem.certificates.editor.subtitle')}
          bind:value={certificateEditorStore.draft.subtitle}
          placeholder={$t('course.navItem.certificates.editor.subtitle_placeholder')}
          isDisabled={disabled}
          name="field-subtitle"
          testId="certificate-subtitle"
        />
      </Field.Field>
      <Field.Field>
        <TextareaField
          id="field-description"
          label={$t('course.navItem.certificates.editor.description_override')}
          rows={4}
          bind:value={certificateEditorStore.draft.descriptionOverride}
          placeholder={$t('course.navItem.certificates.editor.description_override_placeholder')}
          {disabled}
          name="field-description"
        />
        <Field.Description>
          {$t('course.navItem.certificates.editor.description_override_hint')}
        </Field.Description>
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.navItem.certificates.editor.section_signatories')}</Field.Legend>
    <Field.Group>
      <Field.Set>
        <Field.Field orientation="horizontal">
          <Switch bind:checked={certificateEditorStore.draft.signatories[0].enabled} {disabled} />
          <Field.Label>{$t('course.navItem.certificates.editor.signatory_one_toggle')}</Field.Label>
        </Field.Field>

        {#if certificateEditorStore.draft.signatories[0].enabled}
          <Field.Group>
            <Field.Field>
              <InputField
                label={$t('course.navItem.certificates.editor.signatory_one_name')}
                bind:value={certificateEditorStore.draft.signatories[0].name}
                isDisabled={disabled}
                name="field-sig-0-name"
                testId="certificate-sig-0-name"
              />
            </Field.Field>
            <Field.Field>
              <InputField
                label={$t('course.navItem.certificates.editor.signatory_one_role')}
                bind:value={certificateEditorStore.draft.signatories[0].role}
                isDisabled={disabled}
                name="field-sig-0-role"
              />
            </Field.Field>
            <Field.Field>
              <Field.Label>{$t('course.navItem.certificates.editor.signature_upload')}</Field.Label>
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
                {$t('course.navItem.certificates.editor.signature_upload_hint')}
              </Field.Description>
            </Field.Field>
          </Field.Group>
        {/if}
      </Field.Set>

      <Field.Separator />

      <Field.Set>
        <Field.Field orientation="horizontal">
          <Switch bind:checked={certificateEditorStore.draft.signatories[1].enabled} {disabled} />
          <Field.Label>{$t('course.navItem.certificates.editor.signatory_two_toggle')}</Field.Label>
        </Field.Field>

        {#if certificateEditorStore.draft.signatories[1].enabled}
          <Field.Group>
            <Field.Field>
              <InputField
                label={$t('course.navItem.certificates.editor.signatory_two_name')}
                bind:value={certificateEditorStore.draft.signatories[1].name}
                isDisabled={disabled}
                name="field-sig-1-name"
                testId="certificate-sig-1-name"
              />
            </Field.Field>
            <Field.Field>
              <InputField
                label={$t('course.navItem.certificates.editor.signatory_two_role')}
                bind:value={certificateEditorStore.draft.signatories[1].role}
                isDisabled={disabled}
                name="field-sig-1-role"
              />
            </Field.Field>
            <Field.Field>
              <Field.Label>{$t('course.navItem.certificates.editor.signature_upload')}</Field.Label>
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
                {$t('course.navItem.certificates.editor.signature_upload_hint')}
              </Field.Description>
            </Field.Field>
          </Field.Group>
        {/if}
      </Field.Set>
    </Field.Group>
  </Field.Set>

  <Field.Separator />
  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.navItem.certificates.editor.section_reference')}</Field.Legend>
    <Field.Field>
      <InputField
        label={$t('course.navItem.certificates.editor.id_format')}
        bind:value={certificateEditorStore.draft.idFormat}
        placeholder={'N° {seq}'}
        isDisabled={disabled}
        name="field-idFormat"
        testId="certificate-id-format"
      />
      <Field.Description>
        {$t('course.navItem.certificates.editor.id_format_hint')}
      </Field.Description>
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.navItem.certificates.editor.qr_position')}</Field.Legend>
    <!-- <Field.Description>Current template: {certificateEditorStore.draft.templateId} — defaults to {certificateEditorStore.draft.verifyPlacements?.[certificateEditorStore.draft.templateId]?.anchor ?? 'top-right'} until changed.</Field.Description> -->
    <div class="grid grid-cols-2 gap-2">
      {#each ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as pos}
        <Button
          variant={certificateEditorStore.draft.verifyPlacements?.[certificateEditorStore.draft.templateId]?.anchor ===
          pos
            ? 'default'
            : 'outline'}
          size="sm"
          {disabled}
          onclick={() => certificateEditorStore.setVerifyPlacement(certificateEditorStore.draft.templateId, pos)}
        >
          {pos}
        </Button>
      {/each}
    </div>
  </Field.Set>
</Field.Group>
