<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import * as Field from '@cio/ui/base/field';
  import { Switch } from '@cio/ui/base/switch';
  import { Input } from '@cio/ui/base/input';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    sig1Enabled: boolean;
    sig1Name: string;
    sig1Role: string;
    sig1SignatureUrl: string;
    sig2Enabled: boolean;
    sig2Name: string;
    sig2Role: string;
    sig2SignatureUrl: string;
  }

  let {
    sig1Enabled = $bindable(true),
    sig1Name = $bindable('Dr. Robert Ford'),
    sig1Role = $bindable('Dean of Academics'),
    sig1SignatureUrl = $bindable(''),
    sig2Enabled = $bindable(true),
    sig2Name = $bindable('Sarah Dean'),
    sig2Role = $bindable('Lead Instructor'),
    sig2SignatureUrl = $bindable('')
  }: Props = $props();
</script>

<div class="space-y-4">
  <!-- Signatory 1 Card -->
  <Card.Root class="border-slate-200 p-3 shadow-none dark:border-slate-800">
    <div class="flex items-center justify-between">
      <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100">
        {$t('certificate_studio.signatory_1')}
      </h4>
      <Switch bind:checked={sig1Enabled} />
    </div>

    {#if sig1Enabled}
      <div class="mt-3 space-y-2.5">
        <Field.Field>
          <Field.Label class="text-xs font-medium text-slate-600 dark:text-slate-400">Name</Field.Label>
          <Input bind:value={sig1Name} placeholder="Dr. Robert Ford" class="h-8 text-xs" />
        </Field.Field>

        <Field.Field>
          <Field.Label class="text-xs font-medium text-slate-600 dark:text-slate-400">Role / Title</Field.Label>
          <Input bind:value={sig1Role} placeholder="Dean of Academics" class="h-8 text-xs" />
        </Field.Field>

        <Field.Field>
          <Field.Label class="text-xs font-medium text-slate-600 dark:text-slate-400">Signature Image URL</Field.Label>
          <Input bind:value={sig1SignatureUrl} placeholder="https://.../sig.png" class="h-8 font-mono text-xs" />
        </Field.Field>
      </div>
    {/if}
  </Card.Root>

  <!-- Signatory 2 Card -->
  <Card.Root class="border-slate-200 p-3 shadow-none dark:border-slate-800">
    <div class="flex items-center justify-between">
      <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100">
        {$t('certificate_studio.signatory_2')}
      </h4>
      <Switch bind:checked={sig2Enabled} />
    </div>

    {#if sig2Enabled}
      <div class="mt-3 space-y-2.5">
        <Field.Field>
          <Field.Label class="text-xs font-medium text-slate-600 dark:text-slate-400">Name</Field.Label>
          <Input bind:value={sig2Name} placeholder="Sarah Dean" class="h-8 text-xs" />
        </Field.Field>

        <Field.Field>
          <Field.Label class="text-xs font-medium text-slate-600 dark:text-slate-400">Role / Title</Field.Label>
          <Input bind:value={sig2Role} placeholder="Lead Instructor" class="h-8 text-xs" />
        </Field.Field>

        <Field.Field>
          <Field.Label class="text-xs font-medium text-slate-600 dark:text-slate-400">Signature Image URL</Field.Label>
          <Input bind:value={sig2SignatureUrl} placeholder="https://.../sig2.png" class="h-8 font-mono text-xs" />
        </Field.Field>
      </div>
    {/if}
  </Card.Root>
</div>
