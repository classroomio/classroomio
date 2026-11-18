<script lang="ts">
  import type { LearningPathLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
  import CheckIcon from '@lucide/svelte/icons/check';

  interface Props {
    variant: OrgLandingPageTheme;
    about?: {
      outcomes?: string[];
      skills?: string[];
    };
    labels?: LearningPathLandingPageLabels;
  }

  let { variant, about, labels }: Props = $props();

  const t = $derived(courseLandingTokens(variant));

  const defaultOutcomes = [
    'Build responsive, accessible websites with semantic HTML and modern CSS',
    'Write production JavaScript: async, APIs, and the DOM',
    'Build and ship interactive React apps with state, hooks, and data fetching',
    'Complete a portfolio-ready capstone project, deployed to production'
  ];

  const outcomes = $derived(about?.outcomes && about.outcomes.length > 0 ? about.outcomes : defaultOutcomes);

  const defaultSkills = [
    'HTML & CSS',
    'Flexbox & Grid',
    'JavaScript',
    'REST APIs',
    'React',
    'State management',
    'Deployment'
  ];

  const skills = $derived(about?.skills && about.skills.length > 0 ? about.skills : defaultSkills);
</script>

<section id="about" class={t.sectionShell}>
  <div class="ui:max-w-[800px] ui:mx-auto">
    <div class={t.sectionHeader}>
      {#if labels?.aboutEyebrow}
        <span class={t.eyebrow}>{labels.aboutEyebrow}</span>
      {/if}
      <h2 class={t.heading}>{labels?.aboutHeading ?? "What you'll learn"}</h2>
      <p class={t.body}>
        {labels?.aboutLead ?? 'Practical, project-first skills — every course ends with something you built.'}
      </p>
      <span class={t.headingRule} aria-hidden="true"></span>
    </div>

    <!-- Outcomes Checklist -->
    <div class="ui:flex ui:flex-col ui:gap-3 ui:mb-12">
      {#each outcomes as outcome}
        <div
          class="ui:flex ui:items-start ui:gap-3.5 ui:p-4 ui:bg-[var(--landing-card)] ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)]"
        >
          <div
            class="ui:size-6 ui:rounded-full ui:bg-[var(--landing-accent)]/15 ui:text-[var(--landing-accent)] ui:flex ui:items-center ui:justify-center ui:shrink-0 ui:mt-0.5"
          >
            <CheckIcon class="ui:size-3.5" />
          </div>
          <span class="ui:text-sm ui:sm:text-base ui:text-[var(--landing-fg)] ui:leading-relaxed">
            {outcome}
          </span>
        </div>
      {/each}
    </div>

    <!-- Skills Section -->
    {#if skills.length > 0}
      <div>
        <h2 class="{t.heading} ui:mb-4">
          {labels?.skillsHeading ?? "Skills you'll gain"}
        </h2>
        <div class="ui:flex ui:flex-wrap ui:gap-2.5">
          {#each skills as skill}
            <span
              class="ui:inline-flex ui:items-center ui:px-3.5 ui:py-1.5 ui:text-sm ui:font-medium ui:text-[var(--landing-fg)] ui:bg-[var(--landing-card)] ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-pill)]"
            >
              {skill}
            </span>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</section>
