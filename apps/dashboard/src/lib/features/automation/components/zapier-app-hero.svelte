<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import { Badge } from '@cio/ui/base/badge';
  import type { TZapierPartnerApp, TZapierRecipe } from '@cio/utils/constants/zapier';

  import ZapierLivePreview from '$features/automation/components/zapier-live-preview.svelte';
  import ZapierOpenButton from '$features/automation/components/zapier-open-button.svelte';
  import {
    buildZapierRecipeUrl,
    getRecipeClassroomioStep,
    getRecipeDirection,
    getRecipeMode,
    isZapierLive
  } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    app: TZapierPartnerApp;
    recipe: TZapierRecipe;
    recipeCount: number;
  }

  let { app, recipe, recipeCount }: Props = $props();

  const T = 'automation.zapier.app_page';
  const isLive = isZapierLive();

  const direction = getRecipeDirection(recipe);
  const classroomioStep = getRecipeClassroomioStep(recipe);
  const partnerStep =
    recipe.trigger.app === 'partner' ? recipe.trigger : recipe.action.app === 'partner' ? recipe.action : null;
  const mode = getRecipeMode(recipe);

  const triggerLabel = $derived(
    classroomioStep?.type === 'read'
      ? $t(`automation.zapier.catalog_triggers.${classroomioStep.key}.verb`)
      : partnerStep
        ? $t(`automation.zapier.partner_steps.${app.slug}.${partnerStep.key}`)
        : ''
  );
  const actionLabel = $derived(partnerStep ? $t(`automation.zapier.partner_steps.${app.slug}.${partnerStep.key}`) : '');

  const headlineBefore = $derived(
    direction === 'out'
      ? $t(`${T}.headline_out_before`, { trigger: triggerLabel, app: app.name })
      : $t(`${T}.headline_in_before`, { trigger: triggerLabel, app: app.name })
  );
  const headlineAfter = $derived(
    direction === 'out'
      ? $t(`${T}.headline_out_after`, { app: app.name })
      : $t(`${T}.headline_in_after`, { app: app.name })
  );
  const lead = $derived(
    direction === 'out'
      ? $t(`${T}.lead_out`, { action: actionLabel, app: app.name })
      : $t(`${T}.lead_in`, { app: app.name })
  );

  const ctaUrl = $derived(buildZapierRecipeUrl(app, recipe));
  const stats = $derived(
    $t(`${T}.stats`, {
      recipes: recipeCount,
      mode:
        mode === 'instant' ? $t('automation.zapier.recipes.mode_instant') : $t('automation.zapier.recipes.mode_polling')
    })
  );
</script>

<section class="ui:border-border relative overflow-hidden border-b px-5 pt-7 pb-14 text-center sm:px-8">
  <div
    class="pointer-events-none absolute inset-0"
    style="background: radial-gradient(40% 60% at 18% 8%, {app.color}3d, transparent 70%), radial-gradient(35% 55% at 82% 4%, #ff4a0033, transparent 72%)"
    aria-hidden="true"
  ></div>
  <div
    class="ui:text-foreground/[0.09] pointer-events-none absolute inset-0"
    style="background-image: radial-gradient(currentColor 1px, transparent 1px); background-size: 18px 18px; mask-image: radial-gradient(60% 70% at 50% 0%, #000, transparent 75%)"
    aria-hidden="true"
  ></div>

  <div class="relative mx-auto flex w-full max-w-[980px] flex-col items-center">
    <div class="flex flex-wrap items-center justify-center gap-2">
      <span
        class="inline-flex items-center gap-1.5 rounded-full border border-green-600/25 bg-green-600/10 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-300"
      >
        <span class="size-1.5 rounded-full bg-green-600" aria-hidden="true"></span>
        {$t(`${T}.preview_live`)}
      </span>

      {#if isLive}
        <Badge variant="outline">
          <ShieldCheckIcon class="custom" />
          {$t(`${T}.official`)}
        </Badge>
      {/if}
    </div>

    <h1
      class="mt-4 max-w-[860px] text-[clamp(30px,4.6vw,52px)] leading-[1.05] font-[650] tracking-[-0.04em] text-balance"
      data-testid="zapier-app-headline"
    >
      <span>{headlineBefore}</span>
      <span class="bg-clip-text text-transparent" style="background-image: linear-gradient(90deg, #ff4a00, {app.color})"
        >{headlineAfter}</span
      >
    </h1>

    <p class="ui:text-muted-foreground mt-4 max-w-[620px] text-[16.5px] leading-relaxed text-pretty">
      {lead}
    </p>

    <div class="mt-11 w-full">
      <ZapierLivePreview {app} {recipe} />
    </div>

    <div class="mt-9 flex flex-col items-center gap-2.5">
      <div class="flex flex-wrap items-center justify-center gap-3">
        <ZapierOpenButton href={ctaUrl} testId="zapier-app-connect">
          <span class="flex size-5 items-center justify-center rounded bg-[#FF4F00] text-white" aria-hidden="true">
            <ZapIcon class="custom size-3" />
          </span>
          {$t(`${T}.connect_cta`, { app: app.name })}
          <ArrowUpRightIcon class="custom size-4" />
        </ZapierOpenButton>

        <p class="ui:text-muted-foreground text-[13px]">{stats}</p>
      </div>
      <p class="ui:text-muted-foreground text-xs">{$t(`${T}.cta_note`)}</p>
    </div>
  </div>
</section>
