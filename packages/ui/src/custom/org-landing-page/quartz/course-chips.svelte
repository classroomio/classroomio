<script lang="ts">
  import type { CourseChipSections, CourseLandingPageLabels } from '../types';
  import QuartzCourseSection from './course-section.svelte';

  interface Props {
    chips: CourseChipSections;
    labels?: CourseLandingPageLabels;
  }

  let { chips, labels }: Props = $props();

  const groups = $derived(
    [
      chips.skills && chips.skills.length > 0
        ? {
            id: 'skills',
            eyebrow: labels?.chipsSkillsEyebrow ?? 'Skills & tools',
            heading: labels?.chipsSkillsHeading ?? "What you'll walk away with",
            items: chips.skills
          }
        : null,
      chips.tools && chips.tools.length > 0
        ? {
            id: 'tools',
            eyebrow: labels?.chipsToolsEyebrow ?? 'Tools',
            heading: labels?.chipsToolsHeading ?? "Tools you'll use",
            items: chips.tools
          }
        : null
    ].filter((group) => group !== null)
  );
</script>

{#each groups as group (group.id)}
  <QuartzCourseSection id={group.id} sectionKey="chips" eyebrow={group.eyebrow} heading={group.heading}>
    <ul class="ui:m-0 ui:p-0 ui:list-none ui:flex ui:flex-wrap ui:gap-2">
      {#each group.items as item (item)}
        <li
          class="ui:border ui:border-[var(--landing-border)] ui:rounded-[var(--landing-radius-pill)] ui:px-3.5 ui:py-1.5 ui:text-[13px] ui:text-[var(--landing-fg-muted)]"
        >
          {item}
        </li>
      {/each}
    </ul>
  </QuartzCourseSection>
{/each}
