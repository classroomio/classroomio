<script lang="ts">
  import * as Tabs from '@cio/ui/base/tabs';
  import type { TZapierPartnerApp, TZapierRecipe } from '@cio/utils/constants/zapier';

  import ZapierRecipeCard from '$features/automation/components/zapier-recipe-card.svelte';
  import { getRecipeDirection, sortRecipes, type ZapierRecipeDirection } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    app: TZapierPartnerApp;
    courses?: { id: string; title: string }[];
    cohorts?: { id: string; title: string }[];
  }

  let { app, courses = [], cohorts = [] }: Props = $props();

  const T = 'automation.zapier.recipes';
  const primaryId = app.recipes[0]?.id;

  const sortedRecipes = $derived(sortRecipes(app.recipes, primaryId));
  const outRecipes = $derived(sortedRecipes.filter((recipe) => getRecipeDirection(recipe) === 'out'));
  const inRecipes = $derived(sortedRecipes.filter((recipe) => getRecipeDirection(recipe) === 'in'));
  const hasBothDirections = $derived(outRecipes.length > 0 && inRecipes.length > 0);

  let selectedDirection = $state<ZapierRecipeDirection | null>(null);

  const activeDirection = $derived(
    selectedDirection ?? (sortedRecipes[0] ? getRecipeDirection(sortedRecipes[0]) : 'out')
  );
  const visibleRecipes = $derived<readonly TZapierRecipe[]>(
    hasBothDirections ? (activeDirection === 'out' ? outRecipes : inRecipes) : sortedRecipes
  );
</script>

<section class="flex flex-col gap-4" data-testid="zapier-recipe-list">
  <div class="max-w-[640px] space-y-1">
    <h2 class="text-lg font-semibold tracking-tight">{$t(`${T}.section_title`, { app: app.name })}</h2>
    <p class="ui:text-muted-foreground text-sm">{$t(`${T}.section_subtitle`)}</p>
  </div>

  {#if hasBothDirections}
    <Tabs.Root value={activeDirection} onValueChange={(value) => (selectedDirection = value as ZapierRecipeDirection)}>
      <Tabs.List aria-label={$t(`${T}.section_title`, { app: app.name })}>
        <Tabs.Trigger value="out">
          {$t(`${T}.tabs_out`)}
          <span class="ui:text-muted-foreground ml-1.5 text-xs tabular-nums">{outRecipes.length}</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="in">
          {$t(`${T}.tabs_in`)}
          <span class="ui:text-muted-foreground ml-1.5 text-xs tabular-nums">{inRecipes.length}</span>
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  {/if}

  <div class="grid items-start gap-4 md:grid-cols-2">
    {#each visibleRecipes as recipe (recipe.id)}
      <ZapierRecipeCard {app} {recipe} {courses} {cohorts} />
    {/each}
  </div>
</section>
