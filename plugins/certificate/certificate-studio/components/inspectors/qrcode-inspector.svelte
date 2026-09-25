<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import { Switch } from '@cio/ui/base/switch';
  import { Input } from '@cio/ui/base/input';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    qrEnabled: boolean;
    idFormat: string;
  }

  let { qrEnabled = $bindable(true), idFormat = $bindable('ACM-{seq}') }: Props = $props();
</script>

<div class="space-y-4">
  <Field.Field
    orientation="horizontal"
    class="items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800"
  >
    <Field.Label class="cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
      {$t('certificate_studio.qr_toggle')}
    </Field.Label>
    <Switch bind:checked={qrEnabled} />
  </Field.Field>

  {#if qrEnabled}
    <Field.Field>
      <Field.Label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {$t('certificate_studio.field_id_format')}
      </Field.Label>
      <Input bind:value={idFormat} placeholder="e.g. ACM-{seq}" class="h-8 font-mono text-xs" />
      <Field.Description class="text-[11px] text-slate-500">
        Placeholders like {'{seq}'} get replaced with the unique certificate serial.
      </Field.Description>
    </Field.Field>
  {/if}
</div>
