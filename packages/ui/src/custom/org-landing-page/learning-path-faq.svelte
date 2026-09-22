<script lang="ts">
  import type { LearningPathFaqItem, LearningPathLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';

  interface Props {
    variant: OrgLandingPageTheme;
    faq: LearningPathFaqItem[];
    labels?: LearningPathLandingPageLabels;
  }

  let { variant, faq, labels }: Props = $props();

  const t = $derived(courseLandingTokens(variant));

  let expanded = $state<Record<string, boolean>>({});
  $effect(() => {
    const initial: Record<string, boolean> = {};
    faq.forEach((item, idx) => {
      if (!(item.id in expanded)) initial[item.id] = idx === 0;
    });
    if (Object.keys(initial).length > 0) expanded = { ...expanded, ...initial };
  });

  function toggle(id: string) {
    expanded = { ...expanded, [id]: !expanded[id] };
  }
</script>

<section id="faq" class={t.sectionShell}>
  <div class={t.sectionInner}>
    <div class={t.sectionHeader}>
      {#if labels?.faqEyebrow}
        <span class={t.eyebrow}>{labels.faqEyebrow}</span>
      {/if}
      <h2 class={t.heading}>{labels?.faqHeading ?? 'Frequently asked questions'}</h2>
      <span class={t.headingRule} aria-hidden="true"></span>
    </div>

    {#if faq.length > 0}
      <div
        class="ui:flex ui:flex-col ui:bg-[var(--landing-card)] ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)] ui:[box-shadow:var(--landing-shadow-card)] ui:divide-y ui:divide-[var(--landing-border)]"
      >
        {#each faq as item (item.id)}
          <div>
            <button
              type="button"
              class="ui:flex ui:w-full ui:items-center ui:justify-between ui:gap-4 ui:px-6 ui:py-4 ui:text-left"
              onclick={() => toggle(item.id)}
              aria-expanded={expanded[item.id] ?? false}
            >
              <span class="ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)]">
                {item.question}
              </span>
              {#if expanded[item.id]}
                <ChevronUpIcon class="ui:size-4 ui:shrink-0 ui:text-[var(--landing-fg-muted)]" />
              {:else}
                <ChevronDownIcon class="ui:size-4 ui:shrink-0 ui:text-[var(--landing-fg-muted)]" />
              {/if}
            </button>
            {#if expanded[item.id]}
              <p class="ui:px-6 ui:pb-4 ui:text-sm ui:leading-relaxed ui:text-[var(--landing-fg-muted)]">
                {item.answer}
              </p>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <p class="ui:text-sm ui:text-[var(--landing-fg-muted)]">{labels?.noFaqLabel ?? 'No questions yet.'}</p>
    {/if}
  </div>
</section>
