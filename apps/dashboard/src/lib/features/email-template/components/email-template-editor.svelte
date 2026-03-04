<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Switch } from '@cio/ui/base/switch';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';

  import { t } from '$lib/utils/functions/translations';
  import type { TEmailTemplateId, TEmailTemplateLocale } from '@cio/utils/constants';
  import { formatEmailTemplateId } from '../utils/email-template-utils';
  import type { EmailTemplateDetail } from '../utils/types';

  interface EmailTemplateDraft {
    isEnabled: boolean;
    logoUrl: string;
    content: string;
  }

  interface Props {
    emailId: TEmailTemplateId | null;
    locale: TEmailTemplateLocale;
    detail: EmailTemplateDetail | null;
    draft: EmailTemplateDraft;
    errors?: Record<string, string>;
    isSaving?: boolean;
    isPreviewLoading?: boolean;
    onSave: () => Promise<boolean> | Promise<void>;
    onPreview: () => Promise<void>;
    onReset: () => Promise<boolean> | Promise<void>;
  }

  let {
    emailId,
    locale,
    detail,
    draft = $bindable(),
    errors = {},
    isSaving = false,
    isPreviewLoading = false,
    onSave,
    onPreview,
    onReset
  }: Props = $props();

  const canDisable = $derived(detail?.catalog.isRequiredTemplate !== true);
  const canReset = $derived(detail?.template !== null);
</script>

{#if !emailId || !detail}
  <div class="ui:text-muted-foreground rounded-md border border-dashed p-6 text-sm">
    {$t('settings.email_templates.editor.empty_state')}
  </div>
{:else}
  <Field.Group class="space-y-4">
    <Field.Set>
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-base font-semibold">{formatEmailTemplateId(emailId)}</h2>
        <Badge variant="outline">{locale.toUpperCase()}</Badge>
        {#if detail.catalog.isRequiredTemplate}
          <Badge variant="secondary">{$t('settings.email_templates.list.required_badge')}</Badge>
        {/if}
      </div>

      <Field.Description class="ui:text-muted-foreground">
        {$t('settings.email_templates.editor.description')}
      </Field.Description>

      {#if detail.fallbackUsed && detail.resolvedLocale}
        <div class="mt-2">
          <Badge variant="outline">
            {$t('settings.email_templates.editor.fallback_label')}: {detail.resolvedLocale.toUpperCase()}
          </Badge>
        </div>
      {/if}
    </Field.Set>

    <Field.Separator />

    <Field.Set>
      <Field.Field orientation="horizontal">
        <Switch bind:checked={draft.isEnabled} disabled={!canDisable || isSaving} />
        <div class="space-y-0.5">
          <Field.Label>{$t('settings.email_templates.editor.enabled_label')}</Field.Label>
          <Field.Description>
            {#if canDisable}
              {$t('settings.email_templates.editor.enabled_description')}
            {:else}
              {$t('settings.email_templates.editor.required_description')}
            {/if}
          </Field.Description>
        </div>
      </Field.Field>
      {#if errors.isEnabled}
        <Field.Error>{$t(errors.isEnabled)}</Field.Error>
      {/if}
    </Field.Set>

    <Field.Set>
      <InputField
        label={$t('settings.email_templates.editor.logo_label')}
        bind:value={draft.logoUrl}
        placeholder={$t('settings.email_templates.editor.logo_placeholder')}
        errorMessage={errors.logoUrl ? $t(errors.logoUrl) : ''}
      />
    </Field.Set>

    <Field.Set>
      <TextareaField
        label={$t('settings.email_templates.editor.content_label')}
        bind:value={draft.content}
        rows={14}
        placeholder={$t('settings.email_templates.editor.content_placeholder')}
        errorMessage={errors.content ? $t(errors.content) : ''}
      />
      <Field.Description class="mt-2">
        {$t('settings.email_templates.editor.placeholder_hint')}
      </Field.Description>
      <div class="mt-2 flex flex-wrap gap-2">
        {#each detail.catalog.placeholders as placeholder (placeholder)}
          <Badge variant="outline" class="text-xs">{`{{${placeholder}}}`}</Badge>
        {/each}
      </div>
    </Field.Set>

    <Field.Set>
      <div class="flex flex-wrap items-center gap-2">
        <Button variant="secondary" loading={isPreviewLoading} disabled={isSaving} onclick={onPreview}>
          {$t('settings.email_templates.actions.preview')}
        </Button>
        <Button variant="default" loading={isSaving} disabled={isPreviewLoading} onclick={onSave}>
          {$t('settings.email_templates.actions.save')}
        </Button>
        <Button variant="outline" disabled={isSaving || isPreviewLoading || !canReset} onclick={onReset}>
          {$t('settings.email_templates.actions.reset')}
        </Button>
      </div>
    </Field.Set>
  </Field.Group>
{/if}
