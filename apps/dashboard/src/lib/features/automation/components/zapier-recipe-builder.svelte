<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import {
    ZAPIER_ACTIONS,
    ZAPIER_TRIGGERS,
    type TZapierPartnerApp,
    type TZapierRecipeStep
  } from '@cio/utils/constants/zapier';

  import ZapierOpenButton from '$features/automation/components/zapier-open-button.svelte';
  import {
    buildZapierRecipeUrl,
    getPartnerSteps,
    type ZapierRecipePrefill
  } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    app: TZapierPartnerApp;
    courses?: { id: string; title: string }[];
    cohorts?: { id: string; title: string }[];
  }

  let { app, courses = [], cohorts = [] }: Props = $props();

  const T = 'automation.zapier.recipes';
  const CHOOSE = '__choose_in_zapier__';
  const NO_PARTNER_TRIGGER = '__no_partner_trigger__';

  const partnerReadSteps = getPartnerSteps(app, 'read');
  const partnerWriteSteps = getPartnerSteps(app, 'write');

  function triggerValueFromStep(step: TZapierRecipeStep): string {
    return step.app === 'classroomio' ? `classroomio:${step.key}` : `partner:${step.key}`;
  }

  function stepFromTriggerValue(value: string): TZapierRecipeStep {
    if (value.startsWith('classroomio:')) {
      return { app: 'classroomio', type: 'read', key: value.slice('classroomio:'.length) as never };
    }

    const key = value.slice('partner:'.length);

    return {
      app: 'partner',
      type: 'read',
      key,
      isInstant: partnerReadSteps.find((step) => step.key === key)?.isInstant ?? true
    };
  }

  function stepFromActionValue(value: string): TZapierRecipeStep | null {
    if (value === CHOOSE) return null;

    if (value.startsWith('classroomio:')) {
      return { app: 'classroomio', type: 'write', key: value.slice('classroomio:'.length) as never };
    }

    return { app: 'partner', type: 'write', key: value.slice('partner:'.length) };
  }

  const initialRecipe = app.recipes[0];
  let triggerValue = $state(
    initialRecipe ? triggerValueFromStep(initialRecipe.trigger) : `classroomio:${ZAPIER_TRIGGERS[0].key}`
  );
  let actionValue = $state(
    initialRecipe?.action.app === 'partner'
      ? `partner:${initialRecipe.action.key}`
      : initialRecipe?.action.app === 'classroomio'
        ? `classroomio:${initialRecipe.action.key}`
        : CHOOSE
  );
  let selectedPrefill = $state('');

  const triggerStep = $derived(stepFromTriggerValue(triggerValue));
  const actionStep = $derived(stepFromActionValue(actionValue));
  const triggerIsClassroomio = $derived(triggerStep.app === 'classroomio');

  const actionOptions = $derived(
    triggerIsClassroomio
      ? partnerWriteSteps.map((step) => ({
          value: `partner:${step.key}`,
          label: $t(`automation.zapier.partner_steps.${app.slug}.${step.key}`)
        }))
      : ZAPIER_ACTIONS.map((action) => ({
          value: `classroomio:${action.key}`,
          label: $t(`automation.zapier.catalog_actions.${action.key}.label`)
        }))
  );

  const prefillField = $derived.by(() => {
    if (triggerStep.app === 'classroomio' && triggerStep.type === 'read') {
      return ZAPIER_TRIGGERS.find((trigger) => trigger.key === triggerStep.key)?.prefill ?? null;
    }

    if (actionStep?.app === 'classroomio' && actionStep.type === 'write') {
      return ZAPIER_ACTIONS.find((action) => action.key === actionStep.key)?.prefill ?? null;
    }

    return null;
  });
  const prefillOptions = $derived(prefillField === 'cohortId' ? cohorts : courses);

  const prefill: ZapierRecipePrefill | null = $derived.by(() => {
    if (!prefillField || !selectedPrefill) return null;

    const option = prefillOptions.find((item) => item.id === selectedPrefill);
    if (!option) return null;

    return { field: prefillField, value: option.id, label: option.title };
  });

  const sentence = $derived.by(() => {
    if (triggerIsClassroomio) {
      const triggerLabel = $t(`automation.zapier.catalog_triggers.${triggerStep.key}.label`);
      if (!actionStep) return $t(`${T}.sentence_out_open`, { trigger: triggerLabel, app: app.name });

      return $t(`${T}.sentence_out`, {
        trigger: triggerLabel,
        action: $t(`automation.zapier.partner_steps.${app.slug}.${actionStep.key}`),
        app: app.name
      });
    }

    const triggerLabel = $t(`automation.zapier.partner_steps.${app.slug}.${triggerStep.key}`);
    if (!actionStep) return $t(`${T}.sentence_in_open`, { trigger: triggerLabel, app: app.name });

    return $t(`${T}.sentence_in`, {
      trigger: triggerLabel,
      action: $t(`automation.zapier.catalog_actions.${actionStep.key}.label`),
      app: app.name
    });
  });

  const recipeForUrl = $derived({
    id: 'builder',
    trigger: triggerStep,
    action: actionStep ?? { app: 'partner', type: 'write', key: '' }
  });
  const openUrl = $derived(buildZapierRecipeUrl(app, recipeForUrl, prefill));

  function handleTriggerChange(value: string) {
    triggerValue = value;
    selectedPrefill = '';

    const firstAction = value.startsWith('classroomio:')
      ? partnerWriteSteps[0]
        ? `partner:${partnerWriteSteps[0].key}`
        : CHOOSE
      : ZAPIER_ACTIONS[0]
        ? `classroomio:${ZAPIER_ACTIONS[0].key}`
        : CHOOSE;

    actionValue = firstAction;
  }

  function handleActionChange(value: string) {
    actionValue = value;
    selectedPrefill = '';
  }

  const selectedPrefillLabel = $derived(
    prefillOptions.find((option) => option.id === selectedPrefill)?.title ?? $t(`${T}.choose_in_zapier`)
  );
</script>

<section
  class="ui:border-border ui:bg-muted/30 flex flex-col gap-4 rounded-2xl border p-4 sm:p-5"
  data-testid="zapier-recipe-builder"
>
  <div class="space-y-1">
    <h2 class="text-base font-semibold tracking-tight">{$t(`${T}.builder_title`)}</h2>
    <p class="ui:text-muted-foreground text-sm">{$t(`${T}.builder_subtitle`)}</p>
  </div>

  <div class="grid gap-3 sm:grid-cols-2">
    <div class="space-y-1.5">
      <p class="ui:text-muted-foreground text-[11px] font-semibold tracking-[0.06em] uppercase">
        {$t(`${T}.builder_trigger_label`)}
      </p>
      <Select.Root type="single" value={triggerValue} onValueChange={handleTriggerChange}>
        <Select.Trigger class="w-full">
          {triggerIsClassroomio
            ? $t(`automation.zapier.catalog_triggers.${triggerStep.key}.label`)
            : $t(`automation.zapier.partner_steps.${app.slug}.${triggerStep.key}`)}
        </Select.Trigger>
        <Select.Content>
          <Select.Group>
            <Select.GroupHeading>{$t(`${T}.builder_in_classroomio`)}</Select.GroupHeading>
            {#each ZAPIER_TRIGGERS as trigger (trigger.key)}
              <Select.Item
                value="classroomio:{trigger.key}"
                label={$t(`automation.zapier.catalog_triggers.${trigger.key}.label`)}
              >
                {$t(`automation.zapier.catalog_triggers.${trigger.key}.label`)}
              </Select.Item>
            {/each}
          </Select.Group>
          <Select.Group>
            <Select.GroupHeading>{$t(`${T}.builder_in_app`, { app: app.name })}</Select.GroupHeading>
            {#if partnerReadSteps.length > 0}
              {#each partnerReadSteps as step (step.key)}
                <Select.Item
                  value="partner:{step.key}"
                  label={$t(`automation.zapier.partner_steps.${app.slug}.${step.key}`)}
                >
                  {$t(`automation.zapier.partner_steps.${app.slug}.${step.key}`)}
                </Select.Item>
              {/each}
            {:else}
              <Select.Item
                value={NO_PARTNER_TRIGGER}
                label={$t(`${T}.builder_no_app_triggers`, { app: app.name })}
                disabled
              >
                <span class="ui:text-muted-foreground">
                  {$t(`${T}.builder_no_app_triggers`, { app: app.name })}
                </span>
              </Select.Item>
            {/if}
          </Select.Group>
        </Select.Content>
      </Select.Root>
    </div>

    <div class="space-y-1.5">
      <p class="ui:text-muted-foreground text-[11px] font-semibold tracking-[0.06em] uppercase">
        {$t(`${T}.builder_action_label`)}
      </p>
      <Select.Root type="single" value={actionValue} onValueChange={handleActionChange}>
        <Select.Trigger class="w-full">
          {actionOptions.find((option) => option.value === actionValue)?.label ?? $t(`${T}.choose_in_zapier`)}
        </Select.Trigger>
        <Select.Content>
          {#each actionOptions as option (option.value)}
            <Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
          {/each}
          <Select.Item value={CHOOSE} label={$t(`${T}.choose_in_zapier`)}>
            {$t(`${T}.choose_in_zapier`)}
          </Select.Item>
        </Select.Content>
      </Select.Root>
    </div>

    {#if prefillField && prefillOptions.length > 0}
      <div class="space-y-1.5 sm:col-span-2">
        <p class="ui:text-muted-foreground text-[11px] font-semibold tracking-[0.06em] uppercase">
          {$t(prefillField === 'cohortId' ? `${T}.prefill_title_cohort` : `${T}.prefill_title`)}
        </p>
        <Select.Root
          type="single"
          value={selectedPrefill || CHOOSE}
          onValueChange={(value) => (selectedPrefill = value === CHOOSE ? '' : value)}
        >
          <Select.Trigger class="w-full sm:max-w-sm">{selectedPrefillLabel}</Select.Trigger>
          <Select.Content>
            <Select.Item value={CHOOSE} label={$t(`${T}.choose_in_zapier`)}>
              {$t(`${T}.choose_in_zapier`)}
            </Select.Item>
            {#each prefillOptions as option (option.id)}
              <Select.Item value={option.id} label={option.title}>{option.title}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    {/if}
  </div>

  <div class="flex flex-wrap items-center justify-between gap-3">
    <p class="min-w-0 text-[13px] leading-relaxed" data-testid="zapier-builder-sentence">{sentence}</p>

    <ZapierOpenButton href={openUrl} class="w-fit shrink-0" testId="zapier-builder-open">
      {$t(`${T}.open_in_zapier`)}
    </ZapierOpenButton>
  </div>
</section>
