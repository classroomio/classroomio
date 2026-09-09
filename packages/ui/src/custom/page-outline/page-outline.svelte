<script lang="ts">
  import { cn } from '../../tools';
  import type { PageOutlineHideBelow, PageOutlineItem } from './types';

  interface Props {
    items: PageOutlineItem[];
    label?: string;
    /**
     * Hide the outline below this breakpoint. Defaults to `lg` so it does
     * not show on mobile. Pass `never` to always render (e.g. Storybook).
     */
    hideBelow?: PageOutlineHideBelow;
    class?: string;
  }

  let { items, label = 'On this page', hideBelow = 'lg', class: className }: Props = $props();

  let activeId = $state<string | null>(null);

  const visibilityClass = $derived(
    hideBelow === 'never'
      ? ''
      : hideBelow === 'md'
        ? 'ui:hidden ui:md:block'
        : hideBelow === 'xl'
          ? 'ui:hidden ui:xl:block'
          : 'ui:hidden ui:lg:block'
  );

  function headingEl(id: string): HTMLElement | null {
    if (typeof document === 'undefined') return null;

    return document.getElementById(id);
  }

  function scrollToId(id: string, behavior: ScrollBehavior = 'smooth') {
    const target = headingEl(id);

    if (!target) return;

    const headerOffsetPx = 96;
    const top = window.scrollY + target.getBoundingClientRect().top - headerOffsetPx;
    window.scrollTo({ top: Math.max(0, top), behavior });
  }

  function setHash(id: string) {
    const url = new URL(window.location.href);
    url.hash = id;
    history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function handleSelect(event: MouseEvent, id: string) {
    event.preventDefault();
    activeId = id;
    setHash(id);
    scrollToId(id);
  }

  function applyHash(hash: string, behavior: ScrollBehavior = 'auto') {
    const match = items.find((item) => item.id === hash);

    if (!match) return;

    activeId = match.id;
    scrollToId(match.id, behavior);
  }

  // Observe heading visibility (and restore the URL hash). This cannot be
  // `$derived` because it subscribes to the DOM, not to reactive inputs.
  $effect(() => {
    const currentItems = items;

    if (currentItems.length === 0) return;

    const hash = window.location.hash.replace(/^#/, '');
    const hashItem = currentItems.find((item) => item.id === hash);

    if (hashItem) {
      activeId = hashItem.id;
      requestAnimationFrame(() => scrollToId(hashItem.id, 'auto'));
    } else {
      activeId = currentItems[0]?.id ?? null;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const top = visible[0]?.target;

        if (top instanceof HTMLElement && top.id) {
          activeId = top.id;
        }
      },
      { rootMargin: '-96px 0px -55% 0px', threshold: [0, 1] }
    );

    for (const item of currentItems) {
      const target = headingEl(item.id);

      if (target) observer.observe(target);
    }

    return () => observer.disconnect();
  });

  function indentClass(level: PageOutlineItem['level']): string {
    if (level === 3) return 'ui:pl-7';
    if (level === 2) return 'ui:pl-4';

    return 'ui:pl-2';
  }
</script>

<svelte:window onhashchange={() => applyHash(window.location.hash.replace(/^#/, ''))} />

{#if items.length > 0}
  <nav class={cn(visibilityClass, 'ui:w-full', className)} aria-label={label}>
    <p class="ui:mb-3 ui:text-xs ui:font-medium ui:uppercase ui:tracking-wide ui:text-muted-foreground">
      {label}
    </p>
    <ul class="ui:border-l ui:border-border">
      {#each items as item (item.id)}
        {@const isActive = activeId === item.id}
        <li>
          <a
            href={`#${item.id}`}
            aria-current={isActive ? 'location' : undefined}
            class={cn(
              'ui:block ui:border-l-2 ui:-ml-px ui:py-1 ui:text-sm ui:leading-snug ui:transition-colors',
              indentClass(item.level),
              isActive
                ? 'ui:border-primary ui:font-medium ui:text-foreground'
                : 'ui:border-transparent ui:text-muted-foreground ui:hover:text-foreground',
              item.level === 1 && 'ui:font-medium'
            )}
            onclick={(event) => handleSelect(event, item.id)}
          >
            {item.title}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
{/if}
