<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import * as Select from '@cio/ui/base/select';
  import { Switch } from '@cio/ui/base/switch';
  import { InputField } from '@cio/ui/custom/input-field';
  import { NumberField } from '@cio/ui/custom/number-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { t } from '$lib/utils/functions/translations';
  import type { WidgetDetail } from '../utils/types';
  import type { WidgetConfig } from '../utils/types';

  interface Props {
    draftConfig: WidgetConfig;
    planGatedFields: WidgetDetail['planGatedFields'];
    /** Zod-keyed validation errors from the last save attempt (e.g. `config.colors.primaryColor`). */
    errors?: Record<string, string>;
    onFieldChange?: (path: string) => void;
  }

  let { draftConfig = $bindable(), planGatedFields, errors = {}, onFieldChange = () => {} }: Props = $props();

  const isPaidPlan = $derived(planGatedFields.isPaidPlan);
  const availableThemes = $derived(planGatedFields.availableThemes);

  const errFor = (path: string) => errors[path] ?? '';
</script>

{#snippet colorField(label: string, key: 'primaryColor' | 'backgroundColor' | 'textColor' | 'borderColor')}
  <Field.Field>
    <Field.Label>{label}</Field.Label>
    <div class="flex items-center gap-2">
      <input
        type="color"
        aria-label={label}
        bind:value={draftConfig.colors[key]}
        oninput={() => onFieldChange(`config.colors.${key}`)}
        class="h-9 w-9 cursor-pointer rounded border bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <span class="ui:text-muted-foreground font-mono text-sm">{draftConfig.colors[key]}</span>
    </div>
    {#if errFor(`config.colors.${key}`)}
      <Field.Error>{errFor(`config.colors.${key}`)}</Field.Error>
    {/if}
  </Field.Field>
{/snippet}

<div class="space-y-6">
  <Field.Group>
    <Field.Set disabled={!isPaidPlan}>
      <Field.Legend>{$t('widgets.editor.design')}</Field.Legend>
      <Field.Field>
        <Field.Label>{$t('widgets.form.theme_preset')}</Field.Label>
        <Select.Root type="single" bind:value={draftConfig.themePreset} disabled={!isPaidPlan}>
          <Select.Trigger>{draftConfig.themePreset}</Select.Trigger>
          <Select.Content>
            {#each availableThemes as theme (theme)}
              <Select.Item value={theme}>{theme}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>

      {@render colorField($t('widgets.form.primary_color'), 'primaryColor')}
      {@render colorField($t('widgets.form.background_color'), 'backgroundColor')}
      {@render colorField($t('widgets.form.text_color'), 'textColor')}
      {@render colorField($t('widgets.form.border_color'), 'borderColor')}
      <NumberField
        integer
        min={0}
        max={32}
        label={$t('widgets.form.border_radius')}
        bind:value={draftConfig.content.borderRadius}
        onInput={() => onFieldChange('config.content.borderRadius')}
        onValueChange={() => onFieldChange('config.content.borderRadius')}
        helperMessage={errFor('config.content.borderRadius') ? '' : $t('widgets.form.border_radius_hint')}
        errorMessage={errFor('config.content.borderRadius')}
      />
      <InputField
        label={$t('widgets.form.font_family')}
        bind:value={draftConfig.typography.fontFamily}
        onInput={() => onFieldChange('config.typography.fontFamily')}
        maxLength={120}
        errorMessage={errFor('config.typography.fontFamily')}
      />
      <NumberField
        min={0.8}
        max={1.4}
        step={0.1}
        label={$t('widgets.form.font_scale')}
        bind:value={draftConfig.typography.fontSizeScale}
        onInput={() => onFieldChange('config.typography.fontSizeScale')}
        onValueChange={() => onFieldChange('config.typography.fontSizeScale')}
        helperMessage={errFor('config.typography.fontSizeScale') ? '' : $t('widgets.form.font_scale_hint')}
        errorMessage={errFor('config.typography.fontSizeScale')}
      />
      <Field.Field orientation="horizontal">
        <Switch bind:checked={draftConfig.branding.showPoweredBy} />
        <Field.Label>{$t('widgets.form.show_powered_by')}</Field.Label>
      </Field.Field>
      <TextareaField
        label={$t('widgets.form.custom_css')}
        bind:value={draftConfig.advanced.customCss}
        oninput={() => onFieldChange('config.advanced.customCss')}
        rows={6}
        maxlength={5000}
        helperMessage={!isPaidPlan
          ? $t('widgets.form.custom_css_locked')
          : errFor('config.advanced.customCss')
            ? ''
            : $t('widgets.form.custom_css_hint')}
        errorMessage={errFor('config.advanced.customCss')}
      />
    </Field.Set>
  </Field.Group>
</div>
