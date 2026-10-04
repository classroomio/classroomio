<script lang="ts">
  import { onDestroy } from 'svelte';
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
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  interface Props {
    disabled?: boolean;
  }

  let { disabled = false }: Props = $props();

  let signatureFiles = $state<Array<File | undefined>>([]);
  let signaturePreviews = $state<string[]>([]);
  let signatureUploads = $state<boolean[]>([]);
  let isDisposed = false;
  const isAnySignatureUploading = $derived(signatureUploads.some(Boolean));

  $effect(() => {
    certificateEditorStore.isSignatureUploading = isAnySignatureUploading;
  });

  $effect(() => {
    certificateEditorStore.draft.signatories.forEach((signatory, index) => {
      if (!signatureUploads[index]) {
        signaturePreviews[index] = signatory.signatureUrl;
      }
    });
  });

  $effect(() => {
    signatureFiles.forEach((signatureFile, index) => {
      if (!signatureFile || signatureUploads[index]) return;

      void uploadSignatorySignature(index, signatureFile);
    });
  });

  async function uploadSignatorySignature(index: number, signatureFile: File) {
    signatureUploads[index] = true;

    try {
      const signatureUrl = await uploadImage(signatureFile);
      if (isDisposed) return;

      certificateEditorStore.setSignatorySignatureUrl(index, signatureUrl);
      signaturePreviews[index] = signatureUrl;
      signatureFiles[index] = undefined;
    } catch (error) {
      console.error('Error uploading signature image:', error);
      signatureFiles[index] = undefined;
      snackbar.error('snackbar.landing_page_settings.error.try_again');
    } finally {
      signatureUploads[index] = false;
    }
  }

  function removeSignatory(index: number) {
    if (isAnySignatureUploading) return;

    signatureFiles.splice(index, 1);
    signaturePreviews.splice(index, 1);
    signatureUploads.splice(index, 1);
    certificateEditorStore.removeSignatory(index);
  }

  onDestroy(() => {
    isDisposed = true;
    certificateEditorStore.isSignatureUploading = false;
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
        />
      </Field.Field>
      <Field.Field>
        <TextareaField
          label={$t('course.navItem.certificates.editor.description_override')}
          rows={4}
          bind:value={certificateEditorStore.draft.descriptionOverride}
          placeholder={$t('course.navItem.certificates.editor.description_override_placeholder')}
          {disabled}
        />
        <Field.Description>
          {$t('course.navItem.certificates.editor.description_override_hint')}
        </Field.Description>
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <div class="flex items-center justify-between">
      <Field.Legend>{$t('course.navItem.certificates.editor.section_signatories')}</Field.Legend>
      {#if certificateEditorStore.draft.signatories.length < 3}
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || isAnySignatureUploading}
          onclick={() => certificateEditorStore.addSignatory()}
        >
          <PlusIcon class="size-4" />
          {$t('certificate_studio.add_signatory')}
        </Button>
      {/if}
    </div>
    <Field.Group>
      {#each certificateEditorStore.draft.signatories as signatory, index (signatory.id ?? index)}
        {#if index > 0}
          <Field.Separator />
        {/if}

        <Field.Set>
          <div class="flex items-center justify-between gap-3">
            <Field.Field orientation="horizontal">
              <Switch bind:checked={signatory.enabled} {disabled} />
              <Field.Label>
                {$t('certificate_studio.enable_signatory')}
              </Field.Label>
            </Field.Field>
            <Button
              variant="secondary"
              size="icon"
              disabled={disabled || isAnySignatureUploading}
              aria-label={$t('certificate_studio.remove_signatory')}
              onclick={() => removeSignatory(index)}
            >
              <Trash2Icon class="size-4" />
            </Button>
          </div>

          {#if signatory.enabled}
            <Field.Group>
              <Field.Field>
                <InputField
                  label={$t('certificate_studio.signer_name')}
                  bind:value={signatory.name}
                  isDisabled={disabled}
                />
              </Field.Field>
              <Field.Field>
                <InputField
                  label={$t('certificate_studio.signer_role')}
                  bind:value={signatory.role}
                  isDisabled={disabled}
                />
              </Field.Field>
              <Field.Field>
                <Field.Label>{$t('course.navItem.certificates.editor.signature_upload')}</Field.Label>
                <UploadImage
                  bind:avatar={signatureFiles[index]}
                  bind:src={signaturePreviews[index]}
                  shape="rounded"
                  widthHeight="h-[56px] w-[120px]"
                  previewVariant="signature"
                  isDisabled={disabled}
                  bind:isUploading={signatureUploads[index]}
                />
                <Field.Description>
                  {$t('course.navItem.certificates.editor.signature_upload_hint')}
                </Field.Description>
              </Field.Field>
            </Field.Group>
          {/if}
        </Field.Set>
      {/each}
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.navItem.certificates.editor.section_reference')}</Field.Legend>
    <Field.Field>
      <InputField
        label={$t('course.navItem.certificates.editor.id_format')}
        bind:value={certificateEditorStore.draft.idFormat}
        placeholder={'N° {seq}'}
        isDisabled={disabled}
      />
      <Field.Description>
        {$t('course.navItem.certificates.editor.id_format_hint')}
      </Field.Description>
    </Field.Field>
  </Field.Set>
</Field.Group>
