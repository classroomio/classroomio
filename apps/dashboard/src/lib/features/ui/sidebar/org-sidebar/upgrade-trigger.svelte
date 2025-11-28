<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import RocketIcon from '@lucide/svelte/icons/rocket';
  import { t } from '$lib/utils/functions/translations';
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import { isFreePlan } from '$lib/utils/store/org';
  import { useSidebar } from '@cio/ui/base/sidebar';

  const sidebar = useSidebar();
</script>

{#if $isFreePlan}
  <div class="animate-icon">
    {#if sidebar.open || sidebar.isMobile}
      <div
        class="mx-2 flex flex-col items-center justify-center gap-4 rounded-md border px-2 py-6 text-center transition-all ease-in-out hover:border-blue-600"
      >
        <RocketIcon class="rocket-launch my-3 size-6" />
        <span class="flex flex-col gap-1">
          <p class="text-base font-semibold">{$t('org_navigation.early_adopter')}</p>
          <p class="text-xs">{$t('org_navigation.unlock')}</p>
        </span>
        <Button data-sidebar="upgrade-trigger" data-slot="upgrade-trigger" type="button" onclick={openUpgradeModal}>
          <RocketIcon class="rocket-launch custom size-4" />
          {$t('org_navigation.upgrade')}
        </Button>
      </div>
    {:else}
      <Button
        data-sidebar="upgrade-trigger"
        data-slot="upgrade-trigger"
        variant="ghost"
        size="icon"
        class="rocket-launch"
        type="button"
        onclick={openUpgradeModal}
      >
        <RocketIcon class="custom size-4" />
        <span class="sr-only">{$t('org_navigation.upgrade')}</span>
      </Button>
    {/if}
  </div>
{/if}

<style>
  :global(.rocket-launch) {
    transform-origin: center bottom;
    transform-box: fill-box;
  }

  /* Full sequence runs once per hover */
  .animate-icon:hover :global(.rocket-launch) {
    animation: rocket-sequence 5s ease-in-out infinite;
  }

  /* Optional: flame flicker during pre-launch + launch */
  .animate-icon:hover :global(.rocket-launch path:first-of-type) {
    animation: flame-sequence 5s ease-in-out infinite;
  }

  /*
    Rocket:
    - 0–60% (~3s): jitter/pre-launch, small moves along nose direction
    - 60–70%: launch along ~60° diagonal (up-right), fade out
    - 70–80%: invisible pause
    - 80–100%: re-enter from opposite side (down-left)
  */
  @keyframes rocket-sequence {
    0% {
      transform: translate(0, 0) scale(1);
      opacity: 1;
    }

    10% {
      transform: translate(1px, -2px) scale(1.02);
      opacity: 1;
    }

    20% {
      transform: translate(0, 0) scale(1);
      opacity: 1;
    }

    30% {
      transform: translate(2px, -3px) scale(1.03);
      opacity: 1;
    }

    40% {
      transform: translate(0, 0) scale(1);
      opacity: 1;
    }

    50% {
      transform: translate(1px, -2px) scale(1.02);
      opacity: 1;
    }

    60% {
      transform: translate(0, 0) scale(1.05);
      opacity: 1;
    }

    /* Launch along a ~60° diagonal: up (-Y) and to the right (+X) */
    70% {
      transform: translate(100%, -173%) scale(1.1);
      opacity: 0;
    }

    /* Off-screen / invisible pause (~1s, 70–80%) */
    80% {
      /* Reposition off-screen in the opposite direction: down-left */
      transform: translate(-100%, 173%) scale(1.1);
      opacity: 0;
    }

    /* Fly back into view from below-left to original position */
    100% {
      transform: translate(0, 0) scale(1);
      opacity: 1;
    }
  }

  /*
    Flame sequence:
    - Moves opposite rocket travel (down-left: -X, +Y) to match exhaust
    - No vertical-only scaling; just uniform scale + diagonal translation
    - Visible 0–70%, then off
  */
  @keyframes flame-sequence {
    0% {
      stroke: var(--main-primary-color);
      opacity: 1;
      transform: translate(-0.5px, 0.9px) scale(1.02);
    }

    10% {
      opacity: 1;
      transform: translate(0, 0) scale(1);
    }

    20% {
      opacity: 1;
      transform: translate(0, 0) scale(1.02);
    }

    30% {
      opacity: 0.8;
      transform: translate(-0.5px, 0.9px) scale(1);
    }

    40% {
      opacity: 0.8;
      transform: translate(0, 0) scale(1.02);
    }

    50% {
      opacity: 1;
      transform: translate(-0.5px, 0.9px) scale(1);
    }

    60% {
      opacity: 0.8;
      transform: translate(0, 0) scale(1.02);
    }

    70% {
      opacity: 0;
      transform: translate(-0.5px, 0.9px) scale(1.1);
    }

    100% {
      opacity: 0;
      transform: translate(-1px, 1.7px) scale(1.12);
    }
  }
</style>
