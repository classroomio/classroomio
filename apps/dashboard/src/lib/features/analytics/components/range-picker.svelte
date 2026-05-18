<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    value: 7 | 30 | 90;
    onChange: (value: 7 | 30 | 90) => void;
  }

  let { value, onChange }: Props = $props();

  const options: Array<{ days: 7 | 30 | 90; labelKey: string }> = [
    { days: 7, labelKey: 'analytics.range.7d' },
    { days: 30, labelKey: 'analytics.range.30d' },
    { days: 90, labelKey: 'analytics.range.90d' }
  ];
</script>

<div class="inline-flex gap-1 rounded-md border p-1">
  {#each options as opt (opt.days)}
    <Button variant={value === opt.days ? 'default' : 'ghost'} size="sm" onclick={() => onChange(opt.days)}>
      {$t(opt.labelKey)}
    </Button>
  {/each}
</div>
