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
  }

  let {
    draftConfig = $bindable(),
    availableThemes,
    canUseCustomColors,
    canUseCustomCss,
    isBrandingForced
  }: Props = $props();
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
      <InputField label={$t('widgets.form.primary_color')} bind:value={draftConfig.colors.primaryColor} />
      <InputField
        label={$t('widgets.form.background_color')}
        bind:value={draftConfig.colors.backgroundColor}
        isDisabled={!canUseCustomColors}
      />
      <InputField
        label={$t('widgets.form.text_color')}
        bind:value={draftConfig.colors.textColor}
        isDisabled={!canUseCustomColors}
      />
      <InputField
        label={$t('widgets.form.border_color')}
        bind:value={draftConfig.colors.borderColor}
        isDisabled={!canUseCustomColors}
      />
      <InputField
        type="number"
        label={$t('widgets.form.border_radius')}
        bind:value={draftConfig.content.borderRadius}
      />
      <InputField label={$t('widgets.form.font_family')} bind:value={draftConfig.typography.fontFamily} />
      <InputField
        type="number"
        label={$t('widgets.form.font_scale')}
        bind:value={draftConfig.typography.fontSizeScale}
      />
      <Field.Field orientation="horizontal">
        <Switch bind:checked={draftConfig.branding.showPoweredBy} disabled={isBrandingForced} />
        <Field.Label>{$t('widgets.form.show_powered_by')}</Field.Label>
      </Field.Field>
      <TextareaField
        label={$t('widgets.form.custom_css')}
        bind:value={draftConfig.advanced.customCss}
        rows={6}
        disabled={!canUseCustomCss}
        helperMessage={!canUseCustomCss ? $t('widgets.form.custom_css_locked') : ''}
      />
    </Field.Set>
  </Field.Group>
</div>
