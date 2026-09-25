<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { Input } from '@cio/ui/base/input';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    badgeStyle: 'gold_seal' | 'ribbon' | 'wax_stamp' | 'crest' | 'none';
    badgeLabel: string;
    foilColor: string;
  }

  let {
    badgeStyle = $bindable('gold_seal'),
    badgeLabel = $bindable('OFFICIAL SEAL'),
    foilColor = $bindable('#d4af37')
  }: Props = $props();

  const BADGE_OPTIONS = [
    { id: 'gold_seal' as const, label: 'certificate_studio.badge_gold_seal' },
    { id: 'ribbon' as const, label: 'certificate_studio.badge_ribbon' },
    { id: 'wax_stamp' as const, label: 'certificate_studio.badge_wax_stamp' },
    { id: 'none' as const, label: 'certificate_studio.badge_none' }
  ];
</script>

<div class="space-y-4">
  <Field.Set>
    <Field.Legend class="text-xs font-semibold text-slate-700 dark:text-slate-300">
      {$t('certificate_studio.badge_style')}
    </Field.Legend>
    <RadioGroup.Root bind:value={badgeStyle} class="mt-2 space-y-1.5">
      {#each BADGE_OPTIONS as opt (opt.id)}
        <Field.Label
          for="badge-opt-{opt.id}"
          class="flex cursor-pointer items-center justify-between rounded-lg border p-2.5 transition-colors {badgeStyle ===
          opt.id
            ? 'border-amber-500 bg-amber-50/50 dark:border-amber-500/70 dark:bg-amber-950/20'
            : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'}"
        >
          <span class="text-xs font-medium text-slate-800 dark:text-slate-200">{$t(opt.label)}</span>
          <RadioGroup.Item value={opt.id} id="badge-opt-{opt.id}" />
        </Field.Label>
      {/each}
    </RadioGroup.Root>
  </Field.Set>

  {#if badgeStyle !== 'none'}
    <Field.Field>
      <Field.Label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {$t('certificate_studio.badge_label')}
      </Field.Label>
      <Input bind:value={badgeLabel} placeholder="e.g. OFFICIAL SEAL" class="h-8 text-xs font-semibold" />
    </Field.Field>

    <Field.Field class="space-y-2">
      <Field.Label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {$t('certificate_studio.foil_color')}
      </Field.Label>
      <div class="flex items-center gap-2">
        <input
          type="color"
          bind:value={foilColor}
          class="size-8 cursor-pointer rounded border border-slate-300 bg-transparent p-0.5"
        />
        <Input bind:value={foilColor} class="h-8 font-mono text-xs uppercase" />
      </div>
    </Field.Field>
  {/if}
</div>
