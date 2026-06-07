<script lang="ts">
  import type { CourseChipSections, CourseLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
  import EditableLandingSection from './editable-section.svelte';

  interface Props {
    variant: OrgLandingPageTheme;
    chips: CourseChipSections;
    labels?: CourseLandingPageLabels;
    /** How many chips to show before the "Show all" affordance kicks in. */
    initialLimit?: number;
  }

  let { variant, chips, labels, initialLimit = 9 }: Props = $props();

  const t = $derived(courseLandingTokens(variant));

  const skills = $derived(chips.skills ?? []);
  const tools = $derived(chips.tools ?? []);

  const hasSkills = $derived(skills.length > 0);
  const hasTools = $derived(tools.length > 0);
  const hasAny = $derived(hasSkills || hasTools);

  let showAllSkills = $state(false);
  let showAllTools = $state(false);

  const visibleSkills = $derived(showAllSkills ? skills : skills.slice(0, initialLimit));
  const visibleTools = $derived(showAllTools ? tools : tools.slice(0, initialLimit));

  const skillsOverflow = $derived(skills.length > initialLimit);
  const toolsOverflow = $derived(tools.length > initialLimit);

  const showAllLabel = $derived(labels?.chipsShowAllLabel ?? 'Show all');
  const showLessLabel = $derived(labels?.chipsShowLessLabel ?? 'Show less');
</script>

{#if hasAny}
  <EditableLandingSection sectionKey="chips">
    <section id="course-chips" class={t.sectionShell}>
      <div class={t.sectionInner}>
        <div class={t.chipsSectionShell}>
          {#if hasSkills}
            <div>
              <h2 class={t.chipsGroupHeading}>
                {labels?.chipsSkillsHeading ?? "Skills you'll gain"}
              </h2>
              <div class={t.chipsGroup}>
                {#each visibleSkills as skill (skill)}
                  <span class={t.chip}>{skill}</span>
                {/each}
                {#if skillsOverflow}
                  <button type="button" class={t.chipsShowAll} onclick={() => (showAllSkills = !showAllSkills)}>
                    {showAllSkills ? showLessLabel : showAllLabel}
                  </button>
                {/if}
              </div>
            </div>
          {/if}

          {#if hasTools}
            <div>
              <h2 class={t.chipsGroupHeading}>
                {labels?.chipsToolsHeading ?? "Tools you'll learn"}
              </h2>
              <div class={t.chipsGroup}>
                {#each visibleTools as tool (tool)}
                  <span class={t.chip}>{tool}</span>
                {/each}
                {#if toolsOverflow}
                  <button type="button" class={t.chipsShowAll} onclick={() => (showAllTools = !showAllTools)}>
                    {showAllTools ? showLessLabel : showAllLabel}
                  </button>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </section>
  </EditableLandingSection>
{/if}
