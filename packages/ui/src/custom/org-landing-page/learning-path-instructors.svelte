<script lang="ts">
  import type { LearningPathInstructorItem, LearningPathLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';

  interface Props {
    variant: OrgLandingPageTheme;
    instructors: LearningPathInstructorItem[];
    labels?: LearningPathLandingPageLabels;
  }

  let { variant, instructors, labels }: Props = $props();

  const t = $derived(courseLandingTokens(variant));
</script>

{#if instructors.length > 0}
  <section id="instructors" class={t.sectionShell}>
    <div class={t.sectionInner}>
      <div class={t.sectionHeader}>
        {#if labels?.instructorsEyebrow}
          <span class={t.eyebrow}>{labels.instructorsEyebrow}</span>
        {/if}
        <h2 class={t.heading}>{labels?.instructorsHeading ?? 'Meet your instructors'}</h2>
        <span class={t.headingRule} aria-hidden="true"></span>
      </div>

      <div class="ui:grid ui:grid-cols-1 ui:gap-6 ui:sm:grid-cols-2 ui:lg:grid-cols-3">
        {#each instructors as instructor (instructor.id)}
          <article
            class="ui:flex ui:flex-col ui:bg-[var(--landing-card)] ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)] ui:[box-shadow:var(--landing-shadow-card)] ui:p-6"
          >
            {#if instructor.avatarUrl}
              <img
                src={instructor.avatarUrl}
                alt={instructor.name}
                loading="lazy"
                class="ui:mb-4 ui:size-16 ui:rounded-full ui:object-cover ui:border ui:border-[var(--landing-border)]"
              />
            {/if}
            <h3 class="ui:text-[var(--landing-fg)] ui:text-base ui:[font-weight:var(--landing-heading-weight)]">
              {instructor.name}
            </h3>
            {#if instructor.role}
              <p class="ui:text-sm ui:text-[var(--landing-fg-muted)]">{instructor.role}</p>
            {/if}
            {#if instructor.bio}
              <p class="ui:mt-3 ui:text-sm ui:leading-relaxed ui:text-[var(--landing-fg-muted)]">{instructor.bio}</p>
            {/if}
          </article>
        {/each}
      </div>
    </div>
  </section>
{/if}
