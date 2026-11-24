<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import type { TZapierPartnerApp, TZapierRecipe } from '@cio/utils/constants/zapier';

  import ZapierAppMark from '$features/automation/components/zapier-app-mark.svelte';
  import ZapierMark from '$features/automation/components/zapier-mark.svelte';
  import ZapierOpenButton from '$features/automation/components/zapier-open-button.svelte';
  import {
    buildZapierRecipeUrl,
    CLASSROOMIO_LOGO_URL,
    describeRecipe,
    getRecipeDirection
  } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    app: TZapierPartnerApp;
    recipe: TZapierRecipe;
  }

  let { app, recipe }: Props = $props();

  const T = 'automation.zapier.recipes';
  const isFromClassroomio = $derived(getRecipeDirection(recipe) === 'out');
  const title = $derived($t(`${T}.${recipe.id}.title`));
  const sentence = $derived(describeRecipe(recipe, app, $t));
</script>

<div class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4" data-testid="zapier-recipe-{recipe.id}">
  <div class="flex shrink-0 items-center gap-1.5">
    {#if isFromClassroomio}
      <ZapierMark src={CLASSROOMIO_LOGO_URL} name="ClassroomIO" size="sm" />
      <ZapierAppMark {app} size="sm" />
    {:else}
      <ZapierAppMark {app} size="sm" />
      <ZapierMark src={CLASSROOMIO_LOGO_URL} name="ClassroomIO" size="sm" />
    {/if}
  </div>

  <div class="min-w-0 flex-1">
    <p class="text-sm font-medium">{title}</p>
    <p class="ui:text-muted-foreground text-sm">{sentence}</p>
  </div>

  <ZapierOpenButton
    href={buildZapierRecipeUrl(app, recipe)}
    variant="outline"
    size="sm"
    class="w-fit shrink-0"
    testId="zapier-recipe-use-{recipe.id}"
  >
    {$t(`${T}.use_zap`)}
    <ArrowUpRightIcon size={14} />
  </ZapierOpenButton>
</div>
