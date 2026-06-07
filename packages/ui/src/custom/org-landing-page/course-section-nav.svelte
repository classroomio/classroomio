<script lang="ts">
  import type { CourseLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
  import * as UnderlineTabs from '../underline-tabs';

  interface SectionNavItem {
    /** DOM id of the section to scroll to (without leading #). */
    id: string;
    label: string;
  }

  interface Props {
    variant: OrgLandingPageTheme;
    items: SectionNavItem[];
    labels?: CourseLandingPageLabels;
  }

  let { variant, items }: Props = $props();

  const t = $derived(courseLandingTokens(variant));

  let activeId = $state<string>('');

  $effect(() => {
    if (typeof window === 'undefined') return;
    if (items.length === 0) return;

    const elements = items.map(({ id }) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) activeId = visible[0].target.id;
      },
      {
        rootMargin: '-120px 0px -55% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });

  function handleScroll(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 24;
    window.scrollTo({ top, behavior: 'smooth' });
  }
</script>

{#if items.length > 1}
  <nav class={t.sectionNavShell}>
    <div class={t.sectionNavInner}>
      <UnderlineTabs.Root bind:value={activeId} class="ui:w-full">
        <UnderlineTabs.List class={t.sectionNavList}>
          {#each items as item (item.id)}
            <UnderlineTabs.Trigger value={item.id} class={t.sectionNavItem} onclick={() => handleScroll(item.id)}>
              {item.label}
            </UnderlineTabs.Trigger>
          {/each}
        </UnderlineTabs.List>
      </UnderlineTabs.Root>
    </div>
  </nav>
{/if}
