<script lang="ts">
  import { Input } from '@cio/ui/base/input';
  import * as Field from '@cio/ui/base/field';
  import * as ToggleGroup from '@cio/ui/base/toggle-group';
  import ColorPicker from 'svelte-awesome-color-picker';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';
  import {
    formatColour,
    HEX_COLOUR_PATTERN,
    hasLowContrastOnWhite,
    parseColour,
    rgbToHex
  } from '$features/onboarding/utils/customise-colour';
  import type { ColourFormat } from '$features/onboarding/utils/types';
  import CustomiseColourSwatchInput from './customise-colour-swatch-input.svelte';

  interface Props {
    hex: string;
    showAdjustedNote: boolean;
    onChange: (hex: string) => void;
  }

  let { hex, showAdjustedNote, onChange }: Props = $props();

  let format = $state<ColourFormat>('hex');
  let draft = $state<string | null>(null);

  const text = $derived(draft ?? formatColour(hex, format));
  const isInvalid = $derived(draft !== null && !parseColour(draft));
  const pickerComponents = { input: CustomiseColourSwatchInput } as never;

  const isLowContrast = $derived(hasLowContrastOnWhite(hex));

  function handleFormatChange(next: string | undefined) {
    if (next !== 'hex' && next !== 'rgb') return;

    format = next;
    draft = null;
  }

  function handleTextInput(event: Event & { currentTarget: HTMLInputElement }) {
    draft = event.currentTarget.value;

    const parsed = parseColour(draft);
    if (!parsed) return;

    onChange(rgbToHex(parsed));
  }

  function handlePickerInput(event: CustomEvent<{ hex: string | undefined }>) {
    const picked = event.detail.hex?.toLowerCase();
    if (!picked || !HEX_COLOUR_PATTERN.test(picked) || picked === hex.toLowerCase()) return;

    draft = null;
    onChange(picked);
  }
</script>

<Field.Field class="gap-0">
  <div class="mb-1.5 flex items-center justify-between gap-3">
    <Field.Label for="onboarding-customise-colour" class="text-[13px] font-medium"
      >{$t('onboarding.v2.customise.colour_custom_title')}</Field.Label
    >
    <ToggleGroup.Root
      type="single"
      value={format}
      onValueChange={handleFormatChange}
      variant="outline"
      spacing={0}
      class="ui:border-border h-[34px] overflow-hidden rounded-lg border"
      aria-label={$t('onboarding.v2.customise.colour_format_label')}
    >
      <ToggleGroup.Item
        value="hex"
        class="ui:text-muted-foreground h-full rounded-none border-0 px-[9px] text-[11.5px] font-semibold shadow-none data-[state=on]:bg-[var(--secondary)] data-[state=on]:text-[var(--secondary-foreground)]"
      >
        {$t('onboarding.v2.customise.colour_format_hex')}
      </ToggleGroup.Item>
      <ToggleGroup.Item
        value="rgb"
        class="ui:text-muted-foreground h-full rounded-none border-0 px-[9px] text-[11.5px] font-semibold shadow-none data-[state=on]:bg-[var(--secondary)] data-[state=on]:text-[var(--secondary-foreground)]"
      >
        {$t('onboarding.v2.customise.colour_format_rgb')}
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  </div>

  <div class="flex items-center gap-2">
    <div class="contents" style="--picker-z-index: 60">
      <ColorPicker
        {hex}
        label={$t('onboarding.v2.customise.colour_picker_label')}
        isAlpha={false}
        isTextInput={false}
        position="responsive"
        components={pickerComponents}
        on:input={handlePickerInput}
      />
    </div>
    <Input
      id="onboarding-customise-colour"
      data-testid="onboarding-customise-colour"
      spellcheck={false}
      value={text}
      placeholder={format === 'hex' ? '#1D4ED8' : 'rgb(29, 78, 216)'}
      aria-invalid={isInvalid}
      aria-describedby="onboarding-customise-colour-hint"
      class={cn('min-w-0 flex-1 tabular-nums', isInvalid && 'border-[var(--destructive)]')}
      oninput={handleTextInput}
    />
  </div>

  <p id="onboarding-customise-colour-hint" class="ui:text-muted-foreground mt-[5px] text-xs">
    {$t('onboarding.v2.customise.colour_hint')}
  </p>

  {#if isInvalid}
    <p class="ui:text-destructive mt-1.5 text-[12.5px]" role="alert">
      {$t('onboarding.v2.customise.colour_invalid')}
    </p>
  {/if}
</Field.Field>

{#if isLowContrast}
  <div
    class="mt-2.5 flex items-start gap-2.5 rounded-[10px] border border-dashed border-amber-600/55 bg-amber-600/15 px-3.5 py-3 text-[12.5px] leading-[1.55]"
    role="status"
  >
    <TriangleAlertIcon class="custom mt-px size-[15px] shrink-0 text-amber-600" />
    <span>
      <b class="font-semibold">{$t('onboarding.v2.customise.colour_contrast_title')}</b>
      {$t('onboarding.v2.customise.colour_contrast_body')}
    </span>
  </div>
{/if}

{#if showAdjustedNote}
  <div
    class="ui:border-border ui:bg-muted mt-2.5 flex items-start gap-2.5 rounded-[10px] border px-3.5 py-3 text-[12.5px] leading-[1.55]"
  >
    <TriangleAlertIcon class="ui:text-muted-foreground custom mt-px size-[15px] shrink-0" />
    <span>{$t('onboarding.v2.customise.colour_adjusted')}</span>
  </div>
{/if}
