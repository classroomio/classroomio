<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { PublicCourse } from '@cio/ui';
  import type { PublicCourseSidebarItem } from '@cio/ui/custom/public-course';
  import { QUESTION_LABELS } from '../exercise-question/question-labels';
  import {
    CALLOUT_FIXTURE,
    COURSE_TITLE_FIXTURE,
    EXERCISE_FIXTURE,
    LESSON_FIXTURE,
    LESSON_LOCKED_FIXTURE,
    ORG_FIXTURE,
    SIDEBAR_FIXTURE
  } from './fixtures';

  const { Story } = defineMeta({
    title: 'Molecules/PublicCourse',
    component: PublicCourse.PublicCourseShell,
    parameters: {
      layout: 'fullscreen'
    },
    tags: ['autodocs']
  });

  const flatItems = SIDEBAR_FIXTURE.flatMap((section) => section.items);
</script>

<Story name="Lesson · desktop + mobile frames">
  {#snippet template()}
    {@const activeSlug = 'hallucination-and-limitations'}
    {@const activeIndex = flatItems.findIndex((item) => item.slug === activeSlug)}
    {@const activeItem = flatItems[activeIndex] ?? null}
    <PublicCourse.PublicCourseShell
      sections={SIDEBAR_FIXTURE}
      courseTitle={COURSE_TITLE_FIXTURE}
      org={ORG_FIXTURE}
      {activeSlug}
      {activeItem}
      activeFlatIndex={activeIndex}
      totalItems={flatItems.length}
      hasPrev={activeIndex > 0}
      hasNext={activeIndex >= 0 && activeIndex < flatItems.length - 1}
      onItemClick={(item: PublicCourseSidebarItem) => console.log('navigate', item.slug)}
      onPrev={() => console.log('prev')}
      onNext={() => console.log('next')}
    >
      <PublicCourse.PublicLessonView lesson={LESSON_FIXTURE} callout={CALLOUT_FIXTURE} />
    </PublicCourse.PublicCourseShell>
  {/snippet}
</Story>

<Story name="Lesson · locked fallback (callout replaces body)">
  {#snippet template()}
    <PublicCourse.PublicCourseShell
      sections={SIDEBAR_FIXTURE}
      courseTitle={COURSE_TITLE_FIXTURE}
      org={ORG_FIXTURE}
      activeSlug="building-agents"
      activeItem={{
        kind: 'lesson',
        id: 'lesson-agents',
        slug: 'building-agents',
        title: 'Building agents',
        isUnlocked: false
      }}
      activeFlatIndex={flatItems.length - 1}
      totalItems={flatItems.length}
      hasPrev
      hasNext={false}
    >
      <PublicCourse.PublicLessonView lesson={LESSON_LOCKED_FIXTURE} callout={CALLOUT_FIXTURE} />
    </PublicCourse.PublicCourseShell>
  {/snippet}
</Story>

<Story name="Exercise · client-graded quiz">
  {#snippet template()}
    {@const activeSlug = 'foundations-quiz'}
    {@const activeIndex = flatItems.findIndex((item) => item.slug === activeSlug)}
    <PublicCourse.PublicCourseShell
      sections={SIDEBAR_FIXTURE}
      courseTitle={COURSE_TITLE_FIXTURE}
      org={ORG_FIXTURE}
      {activeSlug}
      activeItem={flatItems[activeIndex] ?? null}
      activeFlatIndex={activeIndex}
      totalItems={flatItems.length}
      hasPrev={activeIndex > 0}
      hasNext={activeIndex < flatItems.length - 1}
    >
      <PublicCourse.PublicExerciseView exercise={EXERCISE_FIXTURE} callout={CALLOUT_FIXTURE} labels={QUESTION_LABELS} />
    </PublicCourse.PublicCourseShell>
  {/snippet}
</Story>

<Story name="Sidebar · states only">
  {#snippet template()}
    <div class="ui:mx-auto ui:max-w-xs ui:border-r ui:border-border">
      <PublicCourse.PublicCourseSidebar sections={SIDEBAR_FIXTURE} activeSlug="hallucination-and-limitations" />
    </div>
  {/snippet}
</Story>

<Story name="Callout · inline + full variants">
  {#snippet template()}
    <div class="ui:mx-auto ui:max-w-2xl ui:space-y-8 ui:p-8">
      <div>
        <h3 class="ui:mb-2 ui:text-sm ui:font-semibold ui:text-muted-foreground">Inline (at bottom of lessons)</h3>
        <PublicCourse.PublicCourseCallout callout={CALLOUT_FIXTURE} variant="inline" />
      </div>
      <div>
        <h3 class="ui:mb-2 ui:text-sm ui:font-semibold ui:text-muted-foreground">Full (locked item replacement)</h3>
        <PublicCourse.PublicCourseCallout callout={CALLOUT_FIXTURE} variant="full" />
      </div>
      <div>
        <h3 class="ui:mb-2 ui:text-sm ui:font-semibold ui:text-muted-foreground">Full (no callout configured)</h3>
        <PublicCourse.PublicCourseCallout callout={null} variant="full" />
      </div>
    </div>
  {/snippet}
</Story>
