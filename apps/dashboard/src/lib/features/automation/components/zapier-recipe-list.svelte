<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import * as Field from '@cio/ui/base/field';
  import * as Tabs from '@cio/ui/base/tabs';
  import type { TZapierPartnerApp, TZapierRecipe } from '@cio/utils/constants/zapier';

  import ZapierRecipeRow from '$features/automation/components/zapier-recipe-row.svelte';
  import { getRecipeDirection, sortRecipes, type ZapierRecipeDirection } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    app: TZapierPartnerApp;
  }

  let { app }: Props = $props();

  const T = 'automation.zapier.recipes';

  const sortedRecipes = $derived(sortRecipes(app.recipes, app.recipes[0]?.id));
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

<Field.Set class="gap-3" data-testid="zapier-recipe-list">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <Field.Legend class="mb-0">{$t('automation.zapier.popular_zaps')}</Field.Legend>

    {#if hasBothDirections}
      <Tabs.Root
        value={activeDirection}
        onValueChange={(value) => (selectedDirection = value as ZapierRecipeDirection)}
      >
        <Tabs.List aria-label={$t('automation.zapier.popular_zaps')}>
          <Tabs.Trigger value="out">{$t(`${T}.tabs_out`)}</Tabs.Trigger>
          <Tabs.Trigger value="in">{$t(`${T}.tabs_in`)}</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    {/if}
  </div>

  <Card.Root class="ui:divide-border gap-0 divide-y px-4 py-0">
    {#each visibleRecipes as recipe (recipe.id)}
      <ZapierRecipeRow {app} {recipe} />
    {/each}
  </Card.Root>
</Field.Set>
