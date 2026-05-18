<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { t } from '$lib/utils/functions/translations';
  import { certificateEditorStore } from '../store/certificate-editor.store.svelte';

  interface Props {
    disabled?: boolean;
  }

  let { disabled = false }: Props = $props();
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
    <Field.Legend>{$t('course.navItem.certificates.editor.section_signatories')}</Field.Legend>
    <Field.Group>
      <Field.Field>
        <InputField
          label={$t('course.navItem.certificates.editor.signatory_one_name')}
          bind:value={certificateEditorStore.draft.signatories[0].name}
          isDisabled={disabled}
        />
      </Field.Field>
      <Field.Field>
        <InputField
          label={$t('course.navItem.certificates.editor.signatory_one_role')}
          bind:value={certificateEditorStore.draft.signatories[0].role}
          isDisabled={disabled}
        />
      </Field.Field>
      <Field.Field>
        <InputField
          label={$t('course.navItem.certificates.editor.signatory_two_name')}
          bind:value={certificateEditorStore.draft.signatories[1].name}
          isDisabled={disabled}
        />
      </Field.Field>
      <Field.Field>
        <InputField
          label={$t('course.navItem.certificates.editor.signatory_two_role')}
          bind:value={certificateEditorStore.draft.signatories[1].role}
          isDisabled={disabled}
        />
      </Field.Field>
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
