<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import BuyTokensCard from '$features/settings/components/ai-credits/buy-tokens-card.svelte';
  import TeamLeaderboard from '$features/settings/components/ai-credits/team-leaderboard.svelte';
  import UsageChart from '$features/settings/components/ai-credits/usage-chart.svelte';
  import UsageSummaryCards from '$features/settings/components/ai-credits/usage-summary-cards.svelte';
  import { aiCreditsApi } from '$features/settings/api/ai-credits.svelte';
  import { snackbar } from '$features/ui/snackbar/store';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';

  let lastFetchedOrgId = $state<string | null>(null);

  $effect(() => {
    const orgId = $currentOrg.id;

    if (!orgId || orgId === lastFetchedOrgId) {
      return;
    }

    lastFetchedOrgId = orgId;
    void aiCreditsApi.fetchAll();
  });

  onMount(() => {
    if (page.url.searchParams.get('tokens') === 'success') {
      snackbar.success('snackbar.ai_credits.purchase_success');
      void aiCreditsApi.fetchAll();
    }
  });
</script>

<div class="ui:mx-auto flex w-full max-w-5xl flex-col gap-8 px-2 pb-12">
  <UsageSummaryCards usage={aiCreditsApi.usage} purchased={aiCreditsApi.purchased} />
  <p class="ui:text-muted-foreground -mt-4 text-sm">{$t('settings.ai_credits.cost_note')}</p>
  <UsageChart usage={aiCreditsApi.usage} />
  <TeamLeaderboard leaderboard={aiCreditsApi.leaderboard} />
  <BuyTokensCard onBeforeRedirect={() => aiCreditsApi.fetchAll()} />
</div>
