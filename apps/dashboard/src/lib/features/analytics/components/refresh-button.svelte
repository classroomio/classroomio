<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import RefreshIcon from '@lucide/svelte/icons/refresh-cw';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    loading: boolean;
    onClick: () => void;
  }

  let { loading, onClick }: Props = $props();
</script>

<Button variant="outline" size="sm" disabled={loading} onclick={onClick}>
  <RefreshIcon class={loading ? 'animate-spin' : ''} />
  {$t('analytics.refresh')}
</Button>
