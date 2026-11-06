<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Popover from '@cio/ui/base/popover';
  import * as Select from '@cio/ui/base/select';
  import type { TZapierPartnerApp, TZapierRecipe } from '@cio/utils/constants/zapier';

  import ZapierOpenButton from '$features/automation/components/zapier-open-button.svelte';
  import { buildZapierRecipeUrl, type ZapierRecipePrefill } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    app: TZapierPartnerApp;
    recipe: TZapierRecipe;
    field: 'courseId' | 'cohortId';
    options: { id: string; title: string }[];
    testId?: string;
  }

  let { app, recipe, field, options, testId }: Props = $props();

  const T = 'automation.zapier.recipes';
  const CHOOSE_VALUE = '__choose_in_zapier__';

  let isOpen = $state(false);
  let selectedValue = $state(CHOOSE_VALUE);

  const selectedOption = $derived(options.find((option) => option.id === selectedValue) ?? null);
  const prefill: ZapierRecipePrefill | null = $derived(
    selectedOption ? { field, value: selectedOption.id, label: selectedOption.title } : null
  );
  const href = $derived(buildZapierRecipeUrl(app, recipe, prefill));
  const titleKey = $derived(field === 'cohortId' ? `${T}.prefill_title_cohort` : `${T}.prefill_title`);
</script>

<Popover.Root bind:open={isOpen}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button {...props} class="w-fit" {testId}>{$t(`${T}.use_this_zap`)}</Button>
    {/snippet}
  </Popover.Trigger>

  <Popover.Content align="start" class="w-[320px] space-y-3 p-3">
    <div class="space-y-1">
      <p class="text-sm font-semibold">{$t(titleKey)}</p>
      <p class="ui:text-muted-foreground text-xs leading-relaxed">{$t(`${T}.prefill_note`)}</p>
    </div>

    <Select.Root type="single" value={selectedValue} onValueChange={(value) => (selectedValue = value)}>
      <Select.Trigger class="w-full">
        {selectedOption ? selectedOption.title : $t(`${T}.choose_in_zapier`)}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value={CHOOSE_VALUE} label={$t(`${T}.choose_in_zapier`)}>
          {$t(`${T}.choose_in_zapier`)}
        </Select.Item>
        {#each options as option (option.id)}
          <Select.Item value={option.id} label={option.title}>{option.title}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>

    <ZapierOpenButton {href} class="w-fit" testId={testId ? `${testId}-open` : undefined}>
      {$t(`${T}.open_in_zapier`)}
    </ZapierOpenButton>
  </Popover.Content>
</Popover.Root>
