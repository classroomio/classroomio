<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { Input } from '@cio/ui/base/input';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    bgStyle: 'parchment' | 'guilloche' | 'solid' | 'gradient';
    bgPrimary: string;
    bgSecondary: string;
  }

  let {
    bgStyle = $bindable('parchment'),
    bgPrimary = $bindable('#faf8f2'),
    bgSecondary = $bindable('#f3ede0')
  }: Props = $props();

  const BG_OPTIONS = [
    { id: 'parchment' as const, label: 'certificate_studio.bg_parchment' },
    { id: 'guilloche' as const, label: 'certificate_studio.bg_guilloche' },
    { id: 'solid' as const, label: 'certificate_studio.bg_solid' },
    { id: 'gradient' as const, label: 'certificate_studio.bg_gradient' }
  ];
</script>

<div class="space-y-4">
  <Field.Set>
    <Field.Legend class="text-xs font-semibold text-slate-700 dark:text-slate-300">
      {$t('certificate_studio.background_style')}
    </Field.Legend>
    <RadioGroup.Root bind:value={bgStyle} class="mt-2 space-y-1.5">
      {#each BG_OPTIONS as opt (opt.id)}
        <Field.Label
          for="bg-opt-{opt.id}"
          class="flex cursor-pointer items-center justify-between rounded-lg border p-2.5 transition-colors {bgStyle ===
          opt.id
            ? 'border-amber-500 bg-amber-50/50 dark:border-amber-500/70 dark:bg-amber-950/20'
            : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'}"
        >
          <span class="text-xs font-medium text-slate-800 dark:text-slate-200">{$t(opt.label)}</span>
          <RadioGroup.Item value={opt.id} id="bg-opt-{opt.id}" />
        </Field.Label>
      {/each}
    </RadioGroup.Root>
  </Field.Set>

  <Field.Field class="space-y-2">
    <Field.Label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
      {$t('certificate_studio.bg_primary')}
    </Field.Label>
    <div class="flex items-center gap-2">
      <input
        type="color"
        bind:value={bgPrimary}
        class="size-8 cursor-pointer rounded border border-slate-300 bg-transparent p-0.5"
      />
      <Input bind:value={bgPrimary} class="h-8 font-mono text-xs uppercase" />
    </div>
  </Field.Field>

  <Field.Field class="space-y-2">
    <Field.Label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
      {$t('certificate_studio.bg_secondary')}
    </Field.Label>
    <div class="flex items-center gap-2">
      <input
        type="color"
        bind:value={bgSecondary}
        class="size-8 cursor-pointer rounded border border-slate-300 bg-transparent p-0.5"
      />
      <Input bind:value={bgSecondary} class="h-8 font-mono text-xs uppercase" />
    </div>
  </Field.Field>
</div>
