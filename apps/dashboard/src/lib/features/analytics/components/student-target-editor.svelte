<script lang="ts">
  import TargetIcon from '@lucide/svelte/icons/target';
  import { Button } from '@cio/ui/base/button';
  import * as Popover from '@cio/ui/base/popover';
  import { NumberField } from '@cio/ui/custom/number-field';
  import { ANALYTICS_LIMITS } from '@cio/utils/constants/analytics';
  import { t } from '$lib/utils/functions/translations';

  import { analyticsSettingsApi } from '../api';

  interface Props {
    value: number | null;
  }

  let { value }: Props = $props();

  let open = $state(false);
  let draft = $state<number | null>(null);

  const canSave = $derived(draft !== null && draft !== value && !analyticsSettingsApi.isSaving);

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;

    if (isOpen) draft = value;
  }

  async function save(nextTarget: number | null) {
    const saved = await analyticsSettingsApi.updateStudentTarget(nextTarget);

    if (saved) open = false;
  }
</script>

<Popover.Root {open} onOpenChange={handleOpenChange}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button {...props} type="button" variant="outline" size="sm" testId="analytics-student-target">
        <TargetIcon class="size-4" />
        {value ? $t('analytics.target.edit') : $t('analytics.target.set')}
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content align="end" class="w-[280px] space-y-3">
    <NumberField
      label={$t('analytics.target.label')}
      helperMessage={$t('analytics.target.helper')}
      bind:value={draft}
      min={1}
      max={ANALYTICS_LIMITS.studentTargetMax}
      integer
      allowEmpty
      testId="analytics-student-target-input"
    />
    <div class="flex justify-end gap-2">
      {#if value}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={analyticsSettingsApi.isSaving}
          onclick={() => save(null)}
        >
          {$t('analytics.target.clear')}
        </Button>
      {/if}
      <Button
        type="button"
        size="sm"
        loading={analyticsSettingsApi.isSaving}
        disabled={!canSave}
        onclick={() => save(draft)}
      >
        {$t('analytics.target.save')}
      </Button>
    </div>
  </Popover.Content>
</Popover.Root>
