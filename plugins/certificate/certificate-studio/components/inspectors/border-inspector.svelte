<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { t } from '$lib/utils/functions/translations';
  import { PALETTE_SWATCHES } from '../../types';

  interface Props {
    borderStyle: 'victorian' | 'double_gold' | 'geometric' | 'minimal' | 'custom_svg';
    borderWidth: number;
    primaryColor: string;
    cornerAccent: string;
    customSvg: string;
  }

  let {
    borderStyle = $bindable('victorian'),
    borderWidth = $bindable(12),
    primaryColor = $bindable('#d4af37'),
    cornerAccent = $bindable('#85581a'),
    customSvg = $bindable('')
  }: Props = $props();

  const BORDER_OPTIONS = [
    { id: 'victorian' as const, label: 'certificate_studio.border_victorian' },
    { id: 'double_gold' as const, label: 'certificate_studio.border_double_gold' },
    { id: 'geometric' as const, label: 'certificate_studio.border_geometric' },
    { id: 'minimal' as const, label: 'certificate_studio.border_minimal' },
    { id: 'custom_svg' as const, label: 'certificate_studio.border_upload_svg' }
  ];
</script>

<div class="space-y-4">
  <Field.Set>
    <Field.Legend class="text-xs font-semibold text-slate-700 dark:text-slate-300">
      {$t('certificate_studio.border_type')}
    </Field.Legend>
    <RadioGroup.Root bind:value={borderStyle} class="mt-2 space-y-1.5">
      {#each BORDER_OPTIONS as opt (opt.id)}
        <Field.Label
          for="border-opt-{opt.id}"
          class="flex cursor-pointer items-center justify-between rounded-lg border p-2.5 transition-colors {borderStyle ===
          opt.id
            ? 'border-amber-500 bg-amber-50/50 dark:border-amber-500/70 dark:bg-amber-950/20'
            : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'}"
        >
          <span class="text-xs font-medium text-slate-800 dark:text-slate-200">{$t(opt.label)}</span>
          <RadioGroup.Item value={opt.id} id="border-opt-{opt.id}" />
        </Field.Label>
      {/each}
    </RadioGroup.Root>
  </Field.Set>

  {#if borderStyle === 'custom_svg'}
    <Field.Field>
      <Field.Label class="text-xs font-medium text-slate-600 dark:text-slate-400">
        Custom SVG Vector Markup:
      </Field.Label>
      <Textarea
        bind:value={customSvg}
        placeholder="<rect x='20' y='20' ... />"
        rows={4}
        class="font-mono text-[11px]"
      />
    </Field.Field>
  {/if}

  <Field.Field>
    <div class="flex items-center justify-between">
      <Field.Label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {$t('certificate_studio.border_width')}
      </Field.Label>
      <span class="font-mono text-xs font-medium text-slate-500">{borderWidth}px</span>
    </div>
    <input type="range" min="4" max="32" step="2" bind:value={borderWidth} class="mt-2 w-full accent-amber-600" />
  </Field.Field>

  <!-- Primary Color & Corner Accent Color -->
  <Field.Field class="space-y-2">
    <Field.Label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
      {$t('certificate_studio.primary_color')}
    </Field.Label>
    <div class="flex items-center gap-2">
      <input
        type="color"
        bind:value={primaryColor}
        class="size-8 cursor-pointer rounded border border-slate-300 bg-transparent p-0.5"
      />
      <Input bind:value={primaryColor} class="h-8 font-mono text-xs uppercase" />
    </div>
    <div class="flex flex-wrap gap-1.5 pt-1">
      {#each PALETTE_SWATCHES as swatch}
        <button
          type="button"
          class="size-5 rounded-full border border-black/10 transition-transform hover:scale-110"
          style:background-color={swatch}
          onclick={() => (primaryColor = swatch)}
          title={swatch}
        ></button>
      {/each}
    </div>
  </Field.Field>

  <Field.Field class="space-y-2">
    <Field.Label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
      {$t('certificate_studio.corner_accent')}
    </Field.Label>
    <div class="flex items-center gap-2">
      <input
        type="color"
        bind:value={cornerAccent}
        class="size-8 cursor-pointer rounded border border-slate-300 bg-transparent p-0.5"
      />
      <Input bind:value={cornerAccent} class="h-8 font-mono text-xs uppercase" />
    </div>
  </Field.Field>
</div>
