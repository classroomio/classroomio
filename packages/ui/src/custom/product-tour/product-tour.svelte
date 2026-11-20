<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { cn } from '../../tools';
  import { Button } from '../../base/button';
  import type { ProductTourFinishReason, ProductTourLabels, ProductTourStep } from './types';

  interface Props {
    steps: ProductTourStep[];
    completedStepIds?: string[];
    open: boolean;
    labels: ProductTourLabels;
    onStepComplete?: (stepId: string) => void;
    onFinish?: (reason: ProductTourFinishReason) => void;
  }

  interface TargetBox {
    top: number;
    left: number;
    width: number;
    height: number;
  }

  const SPOTLIGHT_PADDING = 6;
  const POPOVER_GAP = 12;
  const VIEWPORT_MARGIN = 8;
  const COMPACT_MAX_WIDTH = 640;
  const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  let { steps, completedStepIds = [], open, labels, onStepComplete, onFinish }: Props = $props();

  let availableIds = $state<string[]>([]);
  let activeId = $state<string | null>(null);
  let targetBox = $state<TargetBox | null>(null);
  let viewportWidth = $state(0);
  let viewportHeight = $state(0);
  let popoverElement = $state<HTMLDivElement | null>(null);
  let popoverWidth = $state(0);
  let popoverHeight = $state(0);

  let completedIds = new Set<string>();
  let previouslyFocused: Element | null = null;
  let frameId = 0;
  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;
  let observedTarget: Element | null = null;
  let lastScrolledId: string | null = null;

  const titleId = `product-tour-title-${Math.random().toString(36).slice(2, 9)}`;
  const bodyId = `product-tour-body-${Math.random().toString(36).slice(2, 9)}`;

  const availableSteps = $derived(
    availableIds.map((id) => steps.find((step) => step.id === id)).filter((step): step is ProductTourStep => !!step)
  );
  const activeIndex = $derived(availableSteps.findIndex((step) => step.id === activeId));
  const activeStep = $derived(activeIndex >= 0 ? availableSteps[activeIndex] : null);
  const isLastStep = $derived(activeIndex === availableSteps.length - 1);
  const isCompact = $derived(viewportWidth > 0 && viewportWidth <= COMPACT_MAX_WIDTH);
  const isVisible = $derived(open && activeStep !== null && targetBox !== null);

  const spotlightStyle = $derived.by(() => {
    if (!targetBox) return '';
    const top = Math.max(targetBox.top - SPOTLIGHT_PADDING, 0);
    const left = Math.max(targetBox.left - SPOTLIGHT_PADDING, 0);
    const right = Math.min(targetBox.left + targetBox.width + SPOTLIGHT_PADDING, viewportWidth);
    const bottom = Math.min(targetBox.top + targetBox.height + SPOTLIGHT_PADDING, viewportHeight);

    return `top:${top}px;left:${left}px;width:${Math.max(right - left, 0)}px;height:${Math.max(bottom - top, 0)}px;`;
  });

  const popoverStyle = $derived.by(() => {
    if (!targetBox || isCompact) return '';

    const spotlightTop = targetBox.top - SPOTLIGHT_PADDING;
    const spotlightBottom = targetBox.top + targetBox.height + SPOTLIGHT_PADDING;
    const maxLeft = Math.max(viewportWidth - popoverWidth - VIEWPORT_MARGIN, VIEWPORT_MARGIN);
    const left = Math.min(Math.max(targetBox.left, VIEWPORT_MARGIN), maxLeft);
    const belowTop = spotlightBottom + POPOVER_GAP;
    const aboveTop = spotlightTop - POPOVER_GAP - popoverHeight;
    const fitsBelow = belowTop + popoverHeight <= viewportHeight - VIEWPORT_MARGIN;
    const fitsAbove = aboveTop >= VIEWPORT_MARGIN;
    const fallbackTop = Math.max(viewportHeight - popoverHeight - VIEWPORT_MARGIN * 2, VIEWPORT_MARGIN);
    const top = fitsBelow ? belowTop : fitsAbove ? aboveTop : fallbackTop;

    return `top:${top}px;left:${left}px;`;
  });

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function findTarget(step: ProductTourStep) {
    try {
      return document.querySelector(step.target);
    } catch {
      return null;
    }
  }

  function readBox(element: Element | null): TargetBox | null {
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
  }

  function pickActiveId(nextAvailableIds: string[]) {
    if (nextAvailableIds.length === 0) return null;
    if (activeId && nextAvailableIds.includes(activeId)) return activeId;

    if (activeId) {
      const currentOrder = steps.findIndex((step) => step.id === activeId);
      const following = nextAvailableIds.find((id) => steps.findIndex((step) => step.id === id) > currentOrder);
      if (following) return following;

      return nextAvailableIds[nextAvailableIds.length - 1];
    }

    return nextAvailableIds.find((id) => !completedIds.has(id)) ?? nextAvailableIds[0];
  }

  function observeTarget(element: Element | null) {
    if (element === observedTarget) return;

    if (observedTarget) resizeObserver?.unobserve(observedTarget);
    observedTarget = element;
    if (element) resizeObserver?.observe(element);
  }

  function measure() {
    frameId = 0;
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;

    const nextAvailableIds = steps.filter((step) => readBox(findTarget(step))).map((step) => step.id);
    const sameAvailable =
      nextAvailableIds.length === availableIds.length &&
      nextAvailableIds.every((id, index) => id === availableIds[index]);
    if (!sameAvailable) availableIds = nextAvailableIds;

    const nextActiveId = pickActiveId(nextAvailableIds);
    if (nextActiveId !== activeId) activeId = nextActiveId;

    const step = steps.find((candidate) => candidate.id === nextActiveId);
    const element = step ? findTarget(step) : null;
    observeTarget(element);
    targetBox = readBox(element);
  }

  function scheduleMeasure() {
    if (frameId) return;

    frameId = requestAnimationFrame(measure);
  }

  function scrollTargetIntoView(step: ProductTourStep) {
    const element = findTarget(step);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const isInView = rect.top >= 0 && rect.bottom <= window.innerHeight;
    if (isInView) return;

    element.scrollIntoView({
      block: isCompact ? 'start' : 'center',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
  }

  function focusPopover() {
    void tick().then(() => popoverElement?.focus({ preventScroll: true }));
  }

  function finish(reason: ProductTourFinishReason) {
    onFinish?.(reason);
  }

  function completeStep(step: ProductTourStep) {
    if (completedIds.has(step.id)) return;

    completedIds.add(step.id);
    onStepComplete?.(step.id);
  }

  function goNext() {
    const step = activeStep;
    if (!step) return;

    completeStep(step);

    if (isLastStep) {
      finish('done');

      return;
    }

    activeId = availableSteps[activeIndex + 1].id;
    scheduleMeasure();
  }

  function goBack() {
    if (activeIndex <= 0) return;

    activeId = availableSteps[activeIndex - 1].id;
    scheduleMeasure();
  }

  function handleDocumentClick(event: MouseEvent) {
    const step = activeStep;
    if (!step?.advanceOnTargetClick) return;

    const target = event.target;
    const element = findTarget(step);
    if (!(target instanceof Node) || !element?.contains(target)) return;

    goNext();
  }

  function handleDocumentKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      finish('skipped');

      return;
    }

    if (event.key !== 'Tab' || !popoverElement) return;

    const focusable = Array.from(popoverElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) {
      event.preventDefault();
      popoverElement.focus();

      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    const isInside = popoverElement.contains(active);

    if (!isInside) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();

      return;
    }

    if (event.shiftKey && (active === first || active === popoverElement)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handlePopoverKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goBack();
    } else if (event.key === 'Enter' && event.target === popoverElement) {
      event.preventDefault();
      goNext();
    }
  }

  function start() {
    completedIds = new Set(completedStepIds);
    previouslyFocused = document.activeElement;
    lastScrolledId = null;
    activeId = null;

    resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(document.documentElement);
    mutationObserver = new MutationObserver(scheduleMeasure);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('scroll', scheduleMeasure, true);
    document.addEventListener('click', handleDocumentClick, true);
    document.addEventListener('keydown', handleDocumentKeydown, true);

    measure();
  }

  function stop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    resizeObserver?.disconnect();
    resizeObserver = null;
    observedTarget = null;
    mutationObserver?.disconnect();
    mutationObserver = null;
    window.removeEventListener('resize', scheduleMeasure);
    window.removeEventListener('scroll', scheduleMeasure, true);
    document.removeEventListener('click', handleDocumentClick, true);
    document.removeEventListener('keydown', handleDocumentKeydown, true);

    if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
      previouslyFocused.focus({ preventScroll: true });
    }

    previouslyFocused = null;
    activeId = null;
    targetBox = null;
    availableIds = [];
  }

  $effect(() => {
    if (!open) return;

    untrack(start);

    return () => untrack(stop);
  });

  $effect(() => {
    const step = activeStep;
    if (!open || !step || step.id === lastScrolledId) return;

    lastScrolledId = step.id;
    untrack(() => {
      scrollTargetIntoView(step);
      focusPopover();
    });
  });
</script>

{#if isVisible && activeStep}
  <div
    aria-hidden="true"
    class="ui:pointer-events-none ui:fixed ui:z-modal ui:rounded-md ui:outline ui:outline-2 ui:outline-primary ui:shadow-[0_0_0_9999px_rgb(0_0_0/0.55)] ui:transition-[top,left,width,height] ui:duration-200 ui:motion-reduce:transition-none"
    style={spotlightStyle}
  ></div>

  <div
    bind:this={popoverElement}
    bind:clientWidth={popoverWidth}
    bind:clientHeight={popoverHeight}
    role="dialog"
    aria-modal="false"
    aria-label={labels.region}
    aria-labelledby={titleId}
    aria-describedby={bodyId}
    tabindex="-1"
    onkeydown={handlePopoverKeydown}
    class={cn(
      'ui:bg-popover ui:text-popover-foreground ui:z-menu-elevated ui:fixed ui:flex ui:flex-col ui:gap-3 ui:border ui:p-4 ui:shadow-lg ui:outline-none',
      isCompact
        ? 'ui:inset-x-0 ui:bottom-0 ui:rounded-t-xl ui:border-b-0'
        : 'ui:w-80 ui:max-w-[calc(100vw-1rem)] ui:rounded-lg'
    )}
    style={popoverStyle}
  >
    <p class="ui:text-muted-foreground ui:text-xs ui:font-medium">
      {labels.counter(activeIndex + 1, availableSteps.length)}
    </p>

    <div class="ui:flex ui:flex-col ui:gap-1">
      <h2 id={titleId} class="ui:text-base ui:font-semibold">{activeStep.title}</h2>
      <p id={bodyId} class="ui:text-muted-foreground ui:text-sm">{activeStep.body}</p>
      {#if activeStep.hint}
        <p class="ui:text-primary ui:text-xs ui:font-medium">{activeStep.hint}</p>
      {/if}
    </div>

    <div class="ui:flex ui:items-center ui:justify-between ui:gap-2">
      <Button size="sm" variant="ghost" onclick={() => finish('skipped')}>{labels.skip}</Button>

      <div class="ui:flex ui:items-center ui:gap-2">
        {#if activeIndex > 0}
          <Button size="sm" variant="outline" onclick={goBack}>{labels.back}</Button>
        {/if}
        <Button size="sm" onclick={goNext}>{isLastStep ? labels.done : labels.next}</Button>
      </div>
    </div>
  </div>
{/if}
