<script lang="ts">
  import { Switch } from '@cio/ui/base/switch';
  import { Textarea } from '@cio/ui/base/textarea';
  import * as Field from '@cio/ui/base/field';
  import { t } from '$lib/utils/functions/translations';
  import { isFreePlan } from '$lib/utils/store/org';

  interface Props {
    isDownloadable: boolean;
    emailMessage: string | null;
    emailMessagePlaceholder?: string;
    onUpdate: (patch: { isDownloadable?: boolean; emailMessage?: string | null }) => void;
    disabled?: boolean;
    errors?: Record<string, string>;
  }

  let {
    isDownloadable,
    emailMessage,
    emailMessagePlaceholder,
    onUpdate,
    disabled = false,
    errors = {}
  }: Props = $props();

  function onEmailMessageInput(e: Event) {
    onUpdate({ emailMessage: (e.currentTarget as HTMLTextAreaElement).value || null });
  }
</script>

<Field.Group class="w-full max-w-md! px-2">
  <Field.Set>
    <Field.Legend>{$t('certificate.rules')}</Field.Legend>

    <Field.Field orientation="horizontal">
      <Switch
        id="certificate-downloadable"
        checked={isDownloadable}
        onCheckedChange={(checked) => {
          onUpdate({ isDownloadable: checked });
        }}
        disabled={$isFreePlan || disabled}
      />
      <div class="flex-1">
        <Field.Label for="certificate-downloadable" class="text-gray-600">
          {$t('certificate.allow')}
        </Field.Label>
      </div>
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('certificate.email_message_label')}</Field.Legend>
    <Field.Field>
      <Textarea
        id="cert-email-message"
        class="w-full"
        rows={4}
        placeholder={emailMessagePlaceholder ?? $t('certificate.email_message_placeholder')}
        value={emailMessage ?? ''}
        oninput={onEmailMessageInput}
        disabled={$isFreePlan || disabled}
      />
      {#if errors['certificate.emailMessage']}
        <Field.Error>{errors['certificate.emailMessage']}</Field.Error>
      {/if}
    </Field.Field>
  </Field.Set>
</Field.Group>
