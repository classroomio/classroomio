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
    <div class="ui:max-w-[800px] ui:mx-auto">
      <div class={t.sectionHeader}>
        {#if labels?.instructorsEyebrow}
          <span class={t.eyebrow}>{labels.instructorsEyebrow}</span>
        {/if}
        <h2 class={t.heading}>{labels?.instructorsHeading ?? 'Your instructors'}</h2>
        <p class={t.body}>
          {labels?.instructorsLead ?? 'The tutors behind the courses in this path.'}
        </p>
        <span class={t.headingRule} aria-hidden="true"></span>
      </div>

      <div class="ui:grid ui:grid-cols-1 ui:sm:grid-cols-2 ui:lg:grid-cols-3 ui:gap-5 ui:mt-8">
        {#each instructors as instructor (instructor.id)}
          <article
            class="ui:flex ui:flex-col ui:bg-[var(--landing-card)] ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)] ui:[box-shadow:var(--landing-shadow-card)] ui:p-6"
          >
            {#if instructor.avatarUrl}
              <img
                src={instructor.avatarUrl}
                alt={instructor.name}
                loading="lazy"
                class="ui:mb-4 ui:size-14 ui:rounded-full ui:object-cover ui:border ui:border-[var(--landing-border)]"
              />
            {:else}
              <div
                class="ui:mb-4 ui:size-14 ui:rounded-full ui:bg-[var(--landing-accent)]/15 ui:text-[var(--landing-accent)] ui:flex ui:items-center ui:justify-center ui:font-bold ui:text-base ui:border ui:border-[var(--landing-border)]"
              >
                {instructor.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
            {/if}

            <h3 class="ui:text-base ui:font-semibold ui:text-[var(--landing-fg)]">
              {instructor.name}
            </h3>

            {#if instructor.role}
              <p class="ui:text-xs ui:text-[var(--landing-accent)] ui:font-medium ui:mt-0.5">{instructor.role}</p>
            {/if}

            {#if instructor.bio}
              <p class="ui:mt-3 ui:text-xs ui:sm:text-sm ui:leading-relaxed ui:text-[var(--landing-fg-muted)]">
                {instructor.bio}
              </p>
            {/if}
          </article>
        {/each}
      </div>
    </div>
  </section>
{/if}
