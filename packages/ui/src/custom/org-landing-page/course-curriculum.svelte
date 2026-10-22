<script lang="ts">
  import type {
    CourseCurriculum,
    CourseCurriculumLesson,
    CourseCurriculumSection,
    CourseLandingPageLabels,
    OrgLandingPageTheme
  } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
  import EditableLandingSection from './editable-section.svelte';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
  import ListChecksIcon from '@lucide/svelte/icons/list-checks';
  import PackageIcon from '@lucide/svelte/icons/package';

  interface Props {
    variant: OrgLandingPageTheme;
    curriculum: CourseCurriculum;
    labels?: CourseLandingPageLabels;
  }

  let { variant, curriculum, labels }: Props = $props();

  const t = $derived(courseLandingTokens(variant));

  type CurriculumLayout = 'accordion' | 'chapters';

  const layoutByTheme: Record<OrgLandingPageTheme, CurriculumLayout> = {
    minimal: 'accordion',
    studio: 'accordion',
    bold: 'chapters',
    classic: 'chapters',
    saas: 'chapters',
    tech: 'chapters',
    corporate: 'chapters',
    terminal: 'chapters',
    editorial: 'chapters',
    quartz: 'accordion',
    vibrant: 'chapters'
  };

  const layout = $derived<CurriculumLayout>(layoutByTheme[variant] ?? 'accordion');

  function lecturePrefix(index: number): string {
    const fn = labels?.lecturePrefix;
    if (fn) return fn(index);
    return String(index + 1).padStart(2, '0');
  }

  function lessonsLabel(count: number): string {
    return labels?.lessonsLabel?.(count) ?? `${count} ${count === 1 ? 'lesson' : 'lessons'}`;
  }

  function exercisesLabel(count: number): string {
    return labels?.exercisesLabel?.(count) ?? `${count} ${count === 1 ? 'exercise' : 'exercises'}`;
  }

  function modulesLabel(count: number): string {
    return labels?.singleActivityModulesLabel?.(count) ?? `${count} ${count === 1 ? 'module' : 'modules'}`;
  }

  function sectionModuleCount(section: CourseCurriculumSection): number {
    return section.activities?.reduce((total, activity) => total + (activity.modules?.length ?? 0), 0) ?? 0;
  }

  function standaloneLabel(section: CourseCurriculumSection): string {
    if (section.standalone === 'exercise') return labels?.standaloneExerciseLabel ?? 'Exercise';
    if (section.standalone === 'activity') {
      const modules = sectionModuleCount(section);
      if (modules > 0) return modulesLabel(modules);

      return labels?.activitiesLabel?.(1) ?? 'Activity';
    }

    return labels?.standaloneLessonLabel ?? 'Lesson';
  }

  function activitiesLabel(count: number): string {
    return labels?.activitiesLabel?.(count) ?? `${count} ${count === 1 ? 'activity' : 'activities'}`;
  }

  function sectionMeta(section: CourseCurriculumSection): string {
    const lessons = section.lessons.length;
    const exercises = section.exerciseCount ?? 0;
    const activities = section.activityCount ?? section.activities?.length ?? 0;
    const modules = sectionModuleCount(section);
    const onlyActivityCourse = lessons === 0 && exercises === 0 && activities === 1;
    const parts: string[] = [];
    if (lessons > 0) parts.push(lessonsLabel(lessons));
    if (exercises) parts.push(exercisesLabel(exercises));
    if (onlyActivityCourse) parts.push(modules > 0 ? modulesLabel(modules) : activitiesLabel(1));
    else if (activities) parts.push(activitiesLabel(activities));

    return parts.join(' · ');
  }

  const firstSectionId = $derived(curriculum.sections.find((section) => !section.standalone)?.id);

  // Accordion state — first section open by default.
  let expanded = $state<Record<string, boolean>>({});
  $effect(() => {
    const initial: Record<string, boolean> = {};
    curriculum.sections.forEach((section) => {
      if (!(section.id in expanded)) initial[section.id] = section.id === firstSectionId;
    });
    if (Object.keys(initial).length > 0) expanded = { ...expanded, ...initial };
  });

  function toggle(id: string) {
    expanded = { ...expanded, [id]: !expanded[id] };
  }
</script>

{#snippet itemRow(item: CourseCurriculumLesson, itemIdx: number)}
  <div class={t.curriculumLessonRow}>
    <span class={t.curriculumLessonPrefix}>{lecturePrefix(itemIdx)}</span>
    {#if item.kind === 'exercise'}
      <ListChecksIcon class={`${t.curriculumLessonIcon} ui:size-4`} />
    {:else if item.kind === 'activity'}
      <PackageIcon class={`${t.curriculumLessonIcon} ui:size-4`} />
    {:else}
      <CircleCheckIcon class={`${t.curriculumLessonIcon} ui:size-4`} />
    {/if}
    <span class={t.curriculumLessonTitle}>{item.title}</span>
    {#if item.durationMinutes}
      <span class="ui:ml-auto ui:text-xs ui:text-[var(--landing-fg-muted)]">
        {item.durationMinutes} min
      </span>
    {/if}
  </div>
  {#if item.kind === 'activity'}
    {#each item.modules ?? [] as module, moduleIdx (module.id)}
      <div class={t.curriculumLessonRow}>
        <span class={t.curriculumLessonPrefix}>{lecturePrefix(moduleIdx)}</span>
        <span class={t.curriculumLessonTitle}>{module.title}</span>
      </div>
    {/each}
  {/if}
{/snippet}

{#snippet standaloneModules(section: CourseCurriculumSection)}
  {#each section.activities ?? [] as activity (activity.id)}
    {#each activity.modules ?? [] as module, moduleIdx (module.id)}
      <div class={t.curriculumLessonRow}>
        <span class={t.curriculumLessonPrefix}>{lecturePrefix(moduleIdx)}</span>
        <span class={t.curriculumLessonTitle}>{module.title}</span>
      </div>
    {/each}
  {/each}
{/snippet}

<EditableLandingSection sectionKey="curriculum">
  <section id="curriculum" class={t.sectionShell}>
    <div class={t.sectionInner}>
      <div class={t.sectionHeader}>
        <span class={t.eyebrow}>{labels?.curriculumEyebrow ?? 'Curriculum'}</span>
        <h2 class={t.heading}>{labels?.curriculumHeading ?? 'What you will study'}</h2>
        <span class={t.headingRule} aria-hidden="true"></span>
      </div>

      {#if layout === 'accordion'}
        <div class={t.curriculumContainer}>
          {#each curriculum.sections as section (section.id)}
            <div class={t.curriculumModule}>
              {#if section.standalone}
                <div class={t.curriculumModuleHeader}>
                  <span class="ui:flex ui:items-center ui:gap-3">
                    <span class="ui:size-4 ui:shrink-0" aria-hidden="true"></span>
                    <span class={t.curriculumModuleTitle}>{section.title}</span>
                  </span>
                  <span class={t.curriculumModuleMeta}>{standaloneLabel(section)}</span>
                </div>
                {@render standaloneModules(section)}
              {:else}
                <button
                  type="button"
                  class={t.curriculumModuleHeader}
                  onclick={() => toggle(section.id)}
                  aria-expanded={expanded[section.id] ?? false}
                >
                  <span class="ui:flex ui:items-center ui:gap-3">
                    {#if expanded[section.id]}
                      <ChevronUpIcon class="ui:size-4 ui:text-[var(--landing-fg-muted)]" />
                    {:else}
                      <ChevronDownIcon class="ui:size-4 ui:text-[var(--landing-fg-muted)]" />
                    {/if}
                    <span class={t.curriculumModuleTitle}>{section.title}</span>
                  </span>
                  <span class={t.curriculumModuleMeta}>
                    {sectionMeta(section)}
                  </span>
                </button>
                {#if expanded[section.id]}
                  <div>
                    {#each section.items ?? section.lessons as item, itemIdx (item.id)}
                      {@render itemRow(item, itemIdx)}
                    {/each}
                  </div>
                {/if}
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <!-- chapters: every section permanently expanded as its own block -->
        <div class="ui:flex ui:flex-col">
          {#each curriculum.sections as section, sectionIdx (section.id)}
            <div class={t.curriculumModule}>
              <div
                class="ui:flex ui:flex-col ui:items-start ui:gap-2 ui:mb-4 ui:md:flex-row ui:md:items-baseline ui:md:justify-between ui:md:gap-4"
              >
                <div class="ui:flex ui:items-baseline ui:gap-4">
                  <span
                    class="ui:text-[var(--landing-accent)] ui:[font-weight:var(--landing-heading-weight)] ui:text-2xl ui:md:text-3xl"
                  >
                    {String(sectionIdx + 1).padStart(2, '0')}
                  </span>
                  <h3 class={t.curriculumModuleTitle}>{section.title}</h3>
                </div>
                <span class={t.curriculumModuleMeta}>
                  {#if section.standalone}
                    {standaloneLabel(section)}
                  {:else}
                    {sectionMeta(section)}
                  {/if}
                </span>
              </div>
              {#if section.standalone}
                {@render standaloneModules(section)}
              {:else}
                <div class="ui:flex ui:flex-col">
                  {#each section.items ?? section.lessons as item, itemIdx (item.id)}
                    {@render itemRow(item, itemIdx)}
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </section>
</EditableLandingSection>
