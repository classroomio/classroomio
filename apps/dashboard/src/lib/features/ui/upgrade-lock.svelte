<script lang="ts">
  import ZapIcon from '@lucide/svelte/icons/zap';
  import { Button } from '@cio/ui/base/button';
  import { openUpgradeModal } from '$lib/utils/store/upgrade-modal';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    /** Hidden from screen readers when false, so entitled fields render nothing. */
    locked?: boolean;
    className?: string;
  }

  let { locked = true, className = '' }: Props = $props();
</script>

{#if locked}
  <Button
    variant="secondary"
    size="icon"
    class="size-6 shrink-0 text-blue-700 dark:text-white {className}"
    title={$t('upgrade.unlock_field')}
    aria-label={$t('upgrade.unlock_field')}
    onclick={openUpgradeModal}
  >
    <ZapIcon class="size-3.5" />
  </Button>
{/if}
