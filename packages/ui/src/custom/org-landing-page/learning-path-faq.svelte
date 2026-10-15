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

  let openIds = $state<Record<string, boolean>>({});

  function toggle(id: string) {
    openIds[id] = !openIds[id];
  }
</script>

<section id="faq" class={t.sectionShell}>
  <div class="ui:max-w-[800px] ui:mx-auto">
    <div class={t.sectionHeader}>
      {#if labels?.faqEyebrow}
        <span class={t.eyebrow}>{labels.faqEyebrow}</span>
      {/if}
      <h2 class={t.heading}>{labels?.faqHeading ?? 'Frequently asked questions'}</h2>
      <span class={t.headingRule} aria-hidden="true"></span>
    </div>

    {#if faq.length > 0}
      <div
        class="ui:flex ui:flex-col ui:bg-[var(--landing-card)] ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)] ui:[box-shadow:var(--landing-shadow-card)] ui:divide-y ui:divide-[var(--landing-border)] ui:mt-6"
      >
        {#each faq as item, index (item.id)}
          <div>
            <button
              type="button"
              class="ui:flex ui:w-full ui:items-center ui:justify-between ui:gap-4 ui:px-6 ui:py-4 ui:text-left ui:cursor-pointer"
              onclick={() => toggle(item.id)}
              aria-expanded={openIds[item.id] ?? index === 0}
            >
              <span class="ui:text-[var(--landing-fg)] ui:font-medium ui:text-sm ui:sm:text-base">
                {item.question}
              </span>
              {#if openIds[item.id] ?? index === 0}
                <ChevronUpIcon class="ui:size-4 ui:shrink-0 ui:text-[var(--landing-fg-muted)]" />
              {:else}
                <ChevronDownIcon class="ui:size-4 ui:shrink-0 ui:text-[var(--landing-fg-muted)]" />
              {/if}
            </button>
            {#if openIds[item.id] ?? index === 0}
              <div
                class="ui:px-6 ui:pb-4 ui:text-xs ui:sm:text-sm ui:leading-relaxed ui:text-[var(--landing-fg-muted)]"
              >
                {item.answer}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <p class="ui:text-sm ui:text-[var(--landing-fg-muted)] ui:mt-4">{labels?.noFaqLabel ?? 'No questions yet.'}</p>
    {/if}
  </div>
</section>
