<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import * as Select from '@cio/ui/base/select';
  import { Switch } from '@cio/ui/base/switch';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { t } from '$lib/utils/functions/translations';
  import type { WidgetDetail } from '../utils/types';
  import type { WidgetConfig } from '../utils/types';

  interface Props {
    draftConfig: WidgetConfig;
    availableThemes: WidgetDetail['planGatedFields']['availableThemes'];
    canUseCustomColors: boolean;
    canUseCustomCss: boolean;
    isBrandingForced: boolean;
    /** Zod-keyed validation errors from the last save attempt (e.g. `config.colors.primaryColor`). */
    errors?: Record<string, string>;
  }

  let {
    draftConfig = $bindable(),
    availableThemes,
    canUseCustomColors,
    canUseCustomCss,
    isBrandingForced,
    errors = {}
  }: Props = $props();

  const errFor = (path: string) => errors[path] ?? '';
</script>

<div class="space-y-6">
  <Field.Group>
    <Field.Set>
      <Field.Legend>{$t('widgets.editor.design')}</Field.Legend>
      <Field.Field>
        <Field.Label>{$t('widgets.form.theme_preset')}</Field.Label>
        <Select.Root type="single" bind:value={draftConfig.themePreset}>
          <Select.Trigger>{draftConfig.themePreset}</Select.Trigger>
          <Select.Content>
            {#each availableThemes as theme (theme)}
              <Select.Item value={theme}>{theme}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('widgets.form.primary_color')}</Field.Label>
        <div class="ui:flex ui:items-center ui:gap-2">
          <input
            type="color"
            bind:value={draftConfig.colors.primaryColor}
            class="ui:h-9 ui:w-9 ui:cursor-pointer ui:rounded ui:border ui:bg-transparent ui:p-0.5"
          />
          <span class="ui:text-muted-foreground ui:font-mono ui:text-sm">{draftConfig.colors.primaryColor}</span>
        </div>
        {#if errFor('config.colors.primaryColor')}
          <Field.Error>{errFor('config.colors.primaryColor')}</Field.Error>
        {/if}
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('widgets.form.background_color')}</Field.Label>
        <div class="ui:flex ui:items-center ui:gap-2">
          <input
            type="color"
            bind:value={draftConfig.colors.backgroundColor}
            disabled={!canUseCustomColors}
            class="ui:h-9 ui:w-9 ui:cursor-pointer ui:rounded ui:border ui:bg-transparent ui:p-0.5 disabled:ui:cursor-not-allowed disabled:ui:opacity-50"
          />
          <span class="ui:text-muted-foreground ui:font-mono ui:text-sm">{draftConfig.colors.backgroundColor}</span>
        </div>
        {#if errFor('config.colors.backgroundColor')}
          <Field.Error>{errFor('config.colors.backgroundColor')}</Field.Error>
        {/if}
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('widgets.form.text_color')}</Field.Label>
        <div class="ui:flex ui:items-center ui:gap-2">
          <input
            type="color"
            bind:value={draftConfig.colors.textColor}
            disabled={!canUseCustomColors}
            class="ui:h-9 ui:w-9 ui:cursor-pointer ui:rounded ui:border ui:bg-transparent ui:p-0.5 disabled:ui:cursor-not-allowed disabled:ui:opacity-50"
          />
          <span class="ui:text-muted-foreground ui:font-mono ui:text-sm">{draftConfig.colors.textColor}</span>
        </div>
        {#if errFor('config.colors.textColor')}
          <Field.Error>{errFor('config.colors.textColor')}</Field.Error>
        {/if}
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('widgets.form.border_color')}</Field.Label>
        <div class="ui:flex ui:items-center ui:gap-2">
          <input
            type="color"
            bind:value={draftConfig.colors.borderColor}
            disabled={!canUseCustomColors}
            class="ui:h-9 ui:w-9 ui:cursor-pointer ui:rounded ui:border ui:bg-transparent ui:p-0.5 disabled:ui:cursor-not-allowed disabled:ui:opacity-50"
          />
          <span class="ui:text-muted-foreground ui:font-mono ui:text-sm">{draftConfig.colors.borderColor}</span>
        </div>
        {#if errFor('config.colors.borderColor')}
          <Field.Error>{errFor('config.colors.borderColor')}</Field.Error>
        {/if}
      </Field.Field>
      <InputField
        type="number"
        label={$t('widgets.form.border_radius')}
        bind:value={draftConfig.content.borderRadius}
        min={0}
        max={32}
        step={1}
        helperMessage={errFor('config.content.borderRadius') ? '' : $t('widgets.form.border_radius_hint')}
        errorMessage={errFor('config.content.borderRadius')}
      />
      <InputField
        label={$t('widgets.form.font_family')}
        bind:value={draftConfig.typography.fontFamily}
        maxLength={120}
        errorMessage={errFor('config.typography.fontFamily')}
      />
      <InputField
        type="number"
        label={$t('widgets.form.font_scale')}
        bind:value={draftConfig.typography.fontSizeScale}
        min={0.8}
        max={1.4}
        step={0.1}
        helperMessage={errFor('config.typography.fontSizeScale') ? '' : $t('widgets.form.font_scale_hint')}
        errorMessage={errFor('config.typography.fontSizeScale')}
      />
      <Field.Field orientation="horizontal">
        <Switch bind:checked={draftConfig.branding.showPoweredBy} disabled={isBrandingForced} />
        <Field.Label>{$t('widgets.form.show_powered_by')}</Field.Label>
      </Field.Field>
      <TextareaField
        label={$t('widgets.form.custom_css')}
        bind:value={draftConfig.advanced.customCss}
        rows={6}
        maxlength={5000}
        disabled={!canUseCustomCss}
        helperMessage={!canUseCustomCss
          ? $t('widgets.form.custom_css_locked')
          : errFor('config.advanced.customCss')
            ? ''
            : $t('widgets.form.custom_css_hint')}
        errorMessage={errFor('config.advanced.customCss')}
      />
    </Field.Set>
  </Field.Group>
</div>
