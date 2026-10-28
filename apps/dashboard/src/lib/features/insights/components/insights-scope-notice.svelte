<script lang="ts">
  import InfoIcon from '@lucide/svelte/icons/info';
  import { resolve } from '$app/paths';
  import * as Alert from '@cio/ui/base/alert';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';

  import { scopeEmptyState } from '../utils/insights-utils';
  import type { InsightsScopeSummary } from '../utils/types';

  interface Props {
    summary: InsightsScopeSummary;
  }

  let { summary }: Props = $props();

  const emptyState = $derived(scopeEmptyState(summary, $currentOrg.siteName));
</script>

<Alert.Root variant="information">
  <InfoIcon />
  <Alert.Title>{$t(emptyState.titleKey)}</Alert.Title>
  <Alert.Description>
    {$t(emptyState.descriptionKey, { count: summary.pendingCount })}
    {#each emptyState.actions as action (action.href)}
      <a
        class="ui:text-primary ml-1 underline"
        href={resolve(action.href, {})}
        data-testid="insights-scope-notice-action"
      >
        {$t(action.labelKey)}
      </a>
    {/each}
  </Alert.Description>
</Alert.Root>
