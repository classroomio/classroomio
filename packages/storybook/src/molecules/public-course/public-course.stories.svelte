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
    LONG_SIDEBAR_FIXTURE,
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
      <PublicCourse.PublicLessonView lesson={LESSON_FIXTURE} videoCaptionsLabel="Captions" callout={CALLOUT_FIXTURE} />
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
      <PublicCourse.PublicLessonView
        lesson={LESSON_LOCKED_FIXTURE}
        videoCaptionsLabel="Captions"
        callout={CALLOUT_FIXTURE}
      />
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
    <div class="ui:border-border mx-auto max-w-xs border-r">
      <PublicCourse.PublicCourseSidebar sections={SIDEBAR_FIXTURE} activeSlug="hallucination-and-limitations" />
    </div>
  {/snippet}
</Story>

<Story name="Bottom nav · ring variant">
  {#snippet template()}
    <div class="ui:relative ui:min-h-[200px] ui:bg-background">
      <PublicCourse.PublicCourseBottomNav
        positionLabel="3 / 12"
        sublineLabel="Hallucination & limitations"
        hasPrev
        hasNext
        centerVariant="ring"
        progressPercent={42}
        onPrev={() => console.log('prev')}
        onNext={() => console.log('next')}
        onOpenSheet={() => console.log('open sheet')}
      />
    </div>
  {/snippet}
</Story>

<Story name="Bottom nav · completed lesson">
  {#snippet template()}
    <div class="ui:relative ui:min-h-[200px] ui:bg-background">
      <PublicCourse.PublicCourseBottomNav
        positionLabel="2 / 6"
        sublineLabel="Delving into Data Analysis with Pandas"
        sublineComplete
        hasPrev
        hasNext
        centerVariant="ring"
        progressPercent={33}
        onPrev={() => console.log('prev')}
        onNext={() => console.log('next')}
        onOpenSheet={() => console.log('open sheet')}
      />
    </div>
  {/snippet}
</Story>

<Story name="Mobile sheet · collapse + long course">
  {#snippet template()}
    {@const activeSlug = 'module-10-lesson-4'}
    <div class="ui:mx-auto ui:max-w-sm ui:border ui:border-border">
      <PublicCourse.PublicCourseMobileSheet
        open
        sections={LONG_SIDEBAR_FIXTURE}
        {activeSlug}
        collapseToSectionId="section-10"
        title="Course outline"
        onItemClick={(item: PublicCourseSidebarItem) => console.log('navigate', item.slug)}
      />
    </div>
  {/snippet}
</Story>

<Story name="Callout · inline + full variants">
  {#snippet template()}
    <div class="mx-auto max-w-2xl space-y-8 p-8">
      <div>
        <h3 class="ui:text-muted-foreground mb-2 text-sm font-semibold">Inline · waves (default)</h3>
        <PublicCourse.PublicCourseCallout callout={CALLOUT_FIXTURE} variant="inline" animation="waves" />
      </div>
      <div>
        <h3 class="ui:text-muted-foreground mb-2 text-sm font-semibold">Inline · dotted</h3>
        <PublicCourse.PublicCourseCallout callout={CALLOUT_FIXTURE} variant="inline" animation="dotted" />
      </div>
      <div>
        <h3 class="ui:text-muted-foreground mb-2 text-sm font-semibold">Full (locked item replacement) · waves</h3>
        <PublicCourse.PublicCourseCallout callout={CALLOUT_FIXTURE} variant="full" animation="waves" />
      </div>
      <div>
        <h3 class="ui:text-muted-foreground mb-2 text-sm font-semibold">Full · dotted</h3>
        <PublicCourse.PublicCourseCallout callout={CALLOUT_FIXTURE} variant="full" animation="dotted" />
      </div>
      <div>
        <h3 class="ui:text-muted-foreground mb-2 text-sm font-semibold">Inline · none (no motion)</h3>
        <PublicCourse.PublicCourseCallout callout={CALLOUT_FIXTURE} variant="inline" animation="none" />
      </div>
      <div>
        <h3 class="ui:text-muted-foreground mb-2 text-sm font-semibold">Full (no callout configured)</h3>
        <PublicCourse.PublicCourseCallout callout={null} variant="full" />
      </div>
    </div>
  {/snippet}
</Story>
