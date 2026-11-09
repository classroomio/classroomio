<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import { Button } from '@cio/ui/base/button';
  import * as EmptyBase from '@cio/ui/base/empty';

  import ZapierOpenButton from '$features/automation/components/zapier-open-button.svelte';
  import ZapierRecipeCard from '$features/automation/components/zapier-recipe-card.svelte';
  import { buildZapierZapUrl, getZapierFeaturedRecipes } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';

  const T = 'automation.zapier.zaps_empty';
  const RECIPES_T = 'automation.zapier.recipes';
  const featuredRecipes = getZapierFeaturedRecipes();
</script>

<div class="flex flex-col gap-6">
  <EmptyBase.Root class="ui:mx-auto ui:h-full ui:max-w-3xl ui:border ui:border-dashed">
    <EmptyBase.Header>
      <EmptyBase.Media class="ui:mb-2">
        <div class="flex items-center gap-2" aria-hidden="true">
          <img src="/logo-192.png" alt="" class="size-10 rounded-lg" />
          <PlusIcon class="custom ui:text-muted-foreground size-4" />
          <span class="flex size-10 items-center justify-center rounded-lg bg-[#FF4F00] text-white">
            <ZapIcon class="custom size-5" />
          </span>
        </div>
      </EmptyBase.Media>
      <EmptyBase.Title>{$t(`${T}.title`)}</EmptyBase.Title>
      <EmptyBase.Description>{$t(`${T}.description`)}</EmptyBase.Description>
    </EmptyBase.Header>
    <EmptyBase.Content>
      <div class="flex flex-wrap justify-center gap-2">
        <ZapierOpenButton href={buildZapierZapUrl([])}>
          {$t('automation.zapier.create_zap')}
          <ArrowUpRightIcon size={16} />
        </ZapierOpenButton>
        <Button variant="outline" href={`${$currentOrgPath}/automation/zapier/apps`} testId="zapier-connect-apps">
          {$t(`${T}.connect_apps`)}
        </Button>
      </div>
    </EmptyBase.Content>
  </EmptyBase.Root>

  <section class="mx-auto flex w-full max-w-3xl flex-col gap-3" data-testid="zapier-featured-recipes">
    <h2 class="text-sm font-semibold">{$t(`${RECIPES_T}.featured_title`)}</h2>

    <div class="grid items-start gap-3 md:grid-cols-3">
      {#each featuredRecipes as featured (featured.recipe.id)}
        <ZapierRecipeCard app={featured.app} recipe={featured.recipe} compact />
      {/each}
    </div>
  </section>
</div>
