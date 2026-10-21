<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';

  import { Button } from '../../base/button';
  import { cn } from '../../tools';
  import { SCROLL_TO_TOP_HIDE_RATIO, SCROLL_TO_TOP_SHOW_RATIO } from './constants';

  type Clearance = 'default' | 'mobile-nav' | 'ask-ai';

  interface Props {
    label: string;
    target?: HTMLElement | null;
    clearance?: Clearance;
    class?: string;
    forceVisible?: boolean;
  }

  let { label, target = null, clearance = 'default', class: className = '', forceVisible = false }: Props = $props();
  let isVisible = $state(false);
  let prefersReducedMotion = $state(false);

  const clearanceClasses: Record<Clearance, string> = {
    default: 'ui:bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))]',
    'mobile-nav': 'ui:bottom-24 lg:ui:bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))]',
    'ask-ai': 'ui:bottom-20 sm:ui:bottom-20 md:ui:bottom-6'
  };

  function updateVisibility() {
    const viewportHeight = target?.clientHeight ?? window.innerHeight;
    const scrollTop = target?.scrollTop ?? window.scrollY;
    const scrollHeight = target?.scrollHeight ?? document.documentElement.scrollHeight;

    if (scrollHeight <= viewportHeight) {
      isVisible = false;
      return;
    }

    if (scrollTop >= viewportHeight * SCROLL_TO_TOP_SHOW_RATIO) {
      isVisible = true;
    } else if (scrollTop < viewportHeight * SCROLL_TO_TOP_HIDE_RATIO) {
      isVisible = false;
    }
  }

  function scrollToTop() {
    const behavior: ScrollBehavior = prefersReducedMotion ? 'instant' : 'smooth';

    if (target) {
      target.scrollTo({ top: 0, behavior });
      return;
    }

    window.scrollTo({ top: 0, behavior });
  }

  onMount(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const container = target;
    const resizeObserver = new ResizeObserver(updateVisibility);
    const mutationObserver = new MutationObserver(updateVisibility);

    prefersReducedMotion = motionPreference.matches;
    motionPreference.addEventListener('change', updateMotionPreference);

    function updateMotionPreference(event: MediaQueryListEvent) {
      prefersReducedMotion = event.matches;
    }

    if (container) {
      container.addEventListener('scroll', updateVisibility, { passive: true });
      resizeObserver.observe(container);
      mutationObserver.observe(container, { childList: true, subtree: true, characterData: true });
    } else {
      resizeObserver.observe(document.body);
      mutationObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    updateVisibility();

    return () => {
      motionPreference.removeEventListener('change', updateMotionPreference);
      container?.removeEventListener('scroll', updateVisibility);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  });
</script>

<svelte:window onscroll={updateVisibility} onresize={updateVisibility} onpopstate={() => (isVisible = false)} />

{#if isVisible || forceVisible}
  <div
    class={cn(
      'ui:fixed ui:right-6 ui:z-30 ui:pb-[env(safe-area-inset-bottom)]',
      clearanceClasses[clearance],
      className
    )}
    transition:fly={{ y: prefersReducedMotion ? 0 : 8, duration: prefersReducedMotion ? 0 : 140 }}
  >
    <Button
      variant="secondary"
      size="icon"
      aria-label={label}
      title={label}
      class="ui:rounded-full ui:shadow-md"
      onclick={scrollToTop}
    >
      <ArrowUpIcon />
    </Button>
  </div>
{/if}
