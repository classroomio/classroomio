<script lang="ts">
  import TargetIcon from '@lucide/svelte/icons/target';
  import { Button } from '@cio/ui/base/button';
  import * as Popover from '@cio/ui/base/popover';
  import { NumberField } from '@cio/ui/custom/number-field';
  import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
  import { t } from '$lib/utils/functions/translations';

  import { insightsSettingsApi } from '../api';

  interface Props {
    value: number | null;
  }

  let { value }: Props = $props();

  let open = $state(false);
  let draft = $state<number | null>(null);

  const canSave = $derived(draft !== null && draft !== value && !insightsSettingsApi.isSaving);

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;

    if (isOpen) draft = value;
  }

  async function save(nextTarget: number | null) {
    const saved = await insightsSettingsApi.updateStudentTarget(nextTarget);

    if (saved) open = false;
  }
</script>

<Popover.Root {open} onOpenChange={handleOpenChange}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button {...props} type="button" variant="outline" size="sm" testId="insights-student-target">
        <TargetIcon class="size-4" />
        {value ? $t('insights.target.edit') : $t('insights.target.set')}
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content align="end" class="w-[280px] space-y-3">
    <NumberField
      label={$t('insights.target.label')}
      helperMessage={$t('insights.target.helper')}
      bind:value={draft}
      min={1}
      max={INSIGHTS_LIMITS.studentTargetMax}
      integer
      allowEmpty
      testId="insights-student-target-input"
    />
    <div class="flex justify-end gap-2">
      {#if value}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={insightsSettingsApi.isSaving}
          onclick={() => save(null)}
        >
          {$t('insights.target.clear')}
        </Button>
      {/if}
      <Button
        type="button"
        size="sm"
        loading={insightsSettingsApi.isSaving}
        disabled={!canSave}
        onclick={() => save(draft)}
      >
        {$t('insights.target.save')}
      </Button>
    </div>
  </Popover.Content>
</Popover.Root>
