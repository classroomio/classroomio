<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import * as Tabs from '@cio/ui/base/tabs';
  import * as Select from '@cio/ui/base/select';
  import { Input } from '@cio/ui/base/input';
  import { t } from '$lib/utils/functions/translations';
  import { FONT_OPTIONS, type TypographyTarget } from '../../types';

  interface Props {
    typographyTarget: TypographyTarget;
    titleFont: string;
    titleSize: number;
    recipientFont: string;
    recipientSize: number;
    bodyFont: string;
    bodySize: number;
    textColor: string;
    letterSpacing: number;
  }

  let {
    typographyTarget = $bindable('recipient'),
    titleFont = $bindable('Bodoni Moda'),
    titleSize = $bindable(38),
    recipientFont = $bindable('Great Vibes'),
    recipientSize = $bindable(56),
    bodyFont = $bindable('Cormorant Garamond'),
    bodySize = $bindable(15),
    textColor = $bindable('#1a1a2e'),
    letterSpacing = $bindable(0.05)
  }: Props = $props();

  const currentFont = $derived(
    typographyTarget === 'recipient' ? recipientFont : typographyTarget === 'title' ? titleFont : bodyFont
  );

  const currentSize = $derived(
    typographyTarget === 'recipient' ? recipientSize : typographyTarget === 'title' ? titleSize : bodySize
  );

  const selectedFontLabel = $derived(FONT_OPTIONS.find((f) => f.value === currentFont)?.label ?? currentFont);

  function handleFontChange(val: string | undefined) {
    if (!val) return;
    if (typographyTarget === 'recipient') recipientFont = val;
    else if (typographyTarget === 'title') titleFont = val;
    else bodyFont = val;
  }

  function handleSizeChange(e: Event) {
    const val = Number((e.target as HTMLInputElement).value);
    if (typographyTarget === 'recipient') recipientSize = val;
    else if (typographyTarget === 'title') titleSize = val;
    else bodySize = val;
  }
</script>

<div class="space-y-4">
  <Field.Field>
    <Field.Label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
      {$t('certificate_studio.target_text')}
    </Field.Label>
    <Tabs.Root bind:value={typographyTarget} class="w-full">
      <Tabs.List class="grid w-full grid-cols-3">
        <Tabs.Trigger value="title">Title</Tabs.Trigger>
        <Tabs.Trigger value="recipient">Recipient</Tabs.Trigger>
        <Tabs.Trigger value="body">Body</Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  </Field.Field>

  <!-- Font Family using @cio/ui/base/select -->
  <Field.Field>
    <Field.Label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
      {$t('certificate_studio.font_family')}
    </Field.Label>
    <Select.Root type="single" value={currentFont} onValueChange={handleFontChange}>
      <Select.Trigger class="h-8 w-full text-xs">
        {selectedFontLabel}
      </Select.Trigger>
      <Select.Content>
        {#each FONT_OPTIONS as font (font.value)}
          <Select.Item value={font.value} label={font.label}>
            {font.label}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </Field.Field>

  <!-- Font Size -->
  <Field.Field>
    <div class="flex items-center justify-between">
      <Field.Label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {$t('certificate_studio.font_size')}
      </Field.Label>
      <span class="font-mono text-xs font-medium text-slate-500">
        {currentSize}px
      </span>
    </div>
    <input
      type="range"
      min="12"
      max="72"
      step="2"
      value={currentSize}
      oninput={handleSizeChange}
      class="mt-2 w-full accent-amber-600"
    />
  </Field.Field>

  <!-- Color -->
  <Field.Field class="space-y-2">
    <Field.Label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
      {$t('certificate_studio.font_color')}
    </Field.Label>
    <div class="flex items-center gap-2">
      <input
        type="color"
        bind:value={textColor}
        class="size-8 cursor-pointer rounded border border-slate-300 bg-transparent p-0.5"
      />
      <Input bind:value={textColor} class="h-8 font-mono text-xs uppercase" />
    </div>
  </Field.Field>

  <!-- Letter Spacing -->
  <Field.Field>
    <div class="flex items-center justify-between">
      <Field.Label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {$t('certificate_studio.letter_spacing')}
      </Field.Label>
      <span class="font-mono text-xs font-medium text-slate-500">{letterSpacing}em</span>
    </div>
    <input type="range" min="0" max="0.4" step="0.02" bind:value={letterSpacing} class="mt-2 w-full accent-amber-600" />
  </Field.Field>
</div>
