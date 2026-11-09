<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import * as Card from '@cio/ui/base/card';
  import type { TZapierPartnerApp, TZapierRecipe } from '@cio/utils/constants/zapier';

  import ZapierAppMark from '$features/automation/components/zapier-app-mark.svelte';
  import ZapierOpenButton from '$features/automation/components/zapier-open-button.svelte';
  import ZapierPrefillPopover from '$features/automation/components/zapier-prefill-popover.svelte';
  import {
    buildZapierRecipeUrl,
    describeRecipe,
    getRecipeDirection,
    getRecipeMode,
    getRecipePrefillField
  } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    app: TZapierPartnerApp;
    recipe: TZapierRecipe;
    courses?: { id: string; title: string }[];
    cohorts?: { id: string; title: string }[];
    compact?: boolean;
  }

  let { app, recipe, courses = [], cohorts = [], compact = false }: Props = $props();

  const T = 'automation.zapier.recipes';
  const direction = getRecipeDirection(recipe);
  const mode = getRecipeMode(recipe);
  const prefillField = getRecipePrefillField(recipe);

  const title = $derived($t(`${T}.${recipe.id}.title`));
  const sentence = $derived(describeRecipe(recipe, app, $t));
  const modeLabel = $derived(mode === 'instant' ? $t(`${T}.mode_instant`) : $t(`${T}.mode_polling`));
  const prefillOptions = $derived(prefillField === 'cohortId' ? cohorts : courses);
</script>

<Card.Root class={compact ? 'h-full gap-3 p-4' : 'h-full gap-4 p-[18px]'} data-testid="zapier-recipe-{recipe.id}">
  <div class="flex items-center gap-2" aria-hidden="true">
    {#if direction === 'out'}
      <span class="flex size-9 items-center justify-center rounded-[10px] bg-[#0542CC] text-xs font-bold text-white">
        C
      </span>
      <span class="ui:ring-card -ml-2 rounded-[10px] ring-2">
        <ZapierAppMark {app} size="sm" />
      </span>
    {:else}
      <ZapierAppMark {app} size="sm" />
      <span class="ui:ring-card -ml-2 rounded-[10px] ring-2">
        <span class="flex size-9 items-center justify-center rounded-[10px] bg-[#0542CC] text-xs font-bold text-white">
          C
        </span>
      </span>
    {/if}
  </div>

  <div class="min-w-0 flex-1 space-y-1.5">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <p class="text-[14px] leading-snug font-semibold">{title}</p>
      <Badge variant={mode === 'instant' ? 'secondary' : 'outline'} class="shrink-0">
        {modeLabel}
      </Badge>
    </div>
    <p class="ui:text-muted-foreground text-[12.5px] leading-[1.5]">{sentence}</p>
  </div>

  {#if prefillField && prefillOptions.length > 0}
    <ZapierPrefillPopover
      {app}
      {recipe}
      field={prefillField}
      options={prefillOptions}
      testId="zapier-recipe-use-{recipe.id}"
    />
  {:else}
    <ZapierOpenButton href={buildZapierRecipeUrl(app, recipe)} class="w-fit" testId="zapier-recipe-use-{recipe.id}">
      {$t(`${T}.use_this_zap`)}
    </ZapierOpenButton>
  {/if}
</Card.Root>
