<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    subtitle: string;
    descriptionOverride: string;
    description: string;
  }

  let {
    subtitle = $bindable('PROUDLY PRESENTED TO'),
    descriptionOverride = $bindable(''),
    description = $bindable('')
  }: Props = $props();
</script>

<div class="space-y-4">
  <Field.Field>
    <Field.Label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
      {$t('certificate_studio.field_subtitle')}
    </Field.Label>
    <Input bind:value={subtitle} placeholder="PROUDLY PRESENTED TO" class="h-8 text-xs" />
  </Field.Field>

  <Field.Field>
    <Field.Label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
      Course Description Template
    </Field.Label>
    <Textarea bind:value={descriptionOverride} rows={3} class="text-xs" />
  </Field.Field>

  <Field.Field>
    <Field.Label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
      {$t('certificate_studio.field_description')}
    </Field.Label>
    <Textarea bind:value={description} rows={2} class="text-xs" placeholder="Internal notes for this template" />
  </Field.Field>
</div>
