<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CourseCard, type CourseCardLabels } from '@cio/ui';
  import UserIcon from '@lucide/svelte/icons/user';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/CourseCard',
    component: CourseCard,
    parameters: { layout: 'centered', controls: { include: FIELDS } },
    tags: ['autodocs']
  });

  const labels: CourseCardLabels = {
    courseBadge: 'Course',
    lesson: 'lesson',
    lessons: 'lessons',
    exercise: 'exercise',
    exercises: 'exercises',
    completedLabel: 'Completed',
    progressLabel: 'progress',
    earnedOn: 'Earned on',
    partOf: 'Part of',
    learnMore: 'Learn more',
    continueCourse: 'Continue course',
    reviewCourse: 'Review course',
    viewCertificate: 'View certificate',
    manage: 'Manage',
    published: 'Published',
    unpublished: 'Unpublished',
    students: 'students'
  };

  const COVER_GRADIENT = 'linear-gradient(135deg, oklch(0.596 0.145 163.225), oklch(0.696 0.17 162.48))';
</script>

<Story name="LMS in progress">
  {#snippet template()}
    <div class="w-80">
      <CourseCard
        href="/courses/modern-web-development"
        title="Modern Web Development with React"
        description="Build fast, interactive user interfaces with React, hooks, and modern JavaScript tooling."
        coverGradient={COVER_GRADIENT}
        lessonCount={24}
        exerciseCount={12}
        progressPercent={45}
        status="IN_PROGRESS"
        isLMS
        {labels}
      />
    </div>
  {/snippet}
</Story>

<Story name="LMS not started">
  {#snippet template()}
    <div class="w-80">
      <CourseCard
        href="/courses/modern-web-development"
        title="Modern Web Development with React"
        description="Build fast, interactive user interfaces with React, hooks, and modern JavaScript tooling."
        coverGradient={COVER_GRADIENT}
        lessonCount={24}
        exerciseCount={12}
        progressPercent={0}
        status="NOT_STARTED"
        isLMS
        {labels}
      />
    </div>
  {/snippet}
</Story>

<Story name="LMS completed">
  {#snippet template()}
    <div class="w-80">
      <CourseCard
        href="/courses/modern-web-development"
        title="Modern Web Development with React"
        description="Build fast, interactive user interfaces with React, hooks, and modern JavaScript tooling."
        coverGradient={COVER_GRADIENT}
        lessonCount={24}
        exerciseCount={12}
        progressPercent={100}
        status="COMPLETED"
        isLMS
        {labels}
      />
    </div>
  {/snippet}
</Story>

<Story name="Admin with type and publish badges">
  {#snippet template()}
    <div class="w-80">
      <CourseCard
        href="/courses/modern-web-development"
        title="Modern Web Development with React"
        description="Build fast, interactive user interfaces with React, hooks, and modern JavaScript tooling."
        coverGradient={COVER_GRADIENT}
        typeBadge={{ label: 'Self paced', icon: UserIcon, iconClass: 'ui:size-3 ui:shrink-0 ui:text-primary' }}
        lessonCount={24}
        exerciseCount={12}
        isPublished
        totalStudents={128}
        isAdmin
        {labels}
      />
    </div>
  {/snippet}
</Story>

<Story name="Admin unpublished with tags snippet">
  {#snippet template()}
    <div class="w-80">
      <CourseCard
        href="/courses/modern-web-development"
        title="Modern Web Development with React"
        description="Build fast, interactive user interfaces with React, hooks, and modern JavaScript tooling."
        coverGradient={COVER_GRADIENT}
        lessonCount={24}
        exerciseCount={12}
        isPublished={false}
        isAdmin
        {labels}
      >
        {#snippet tags()}
          <div class="flex flex-wrap gap-1">
            <span
              class="ui:inline-flex ui:items-center ui:gap-1 ui:rounded-full ui:border ui:px-2 ui:py-0.5 ui:text-xs ui:text-foreground"
            >
              React
            </span>
            <span
              class="ui:inline-flex ui:items-center ui:gap-1 ui:rounded-full ui:border ui:px-2 ui:py-0.5 ui:text-xs ui:text-foreground"
            >
              Frontend
            </span>
          </div>
        {/snippet}
      </CourseCard>
    </div>
  {/snippet}
</Story>

<Story name="Admin with overlay dropdown">
  {#snippet template()}
    <div class="w-80">
      <CourseCard
        href="/courses/modern-web-development"
        title="Modern Web Development with React"
        description="Build fast, interactive user interfaces with React, hooks, and modern JavaScript tooling."
        coverGradient={COVER_GRADIENT}
        lessonCount={24}
        exerciseCount={12}
        isPublished
        totalStudents={128}
        isAdmin
        {labels}
      >
        {#snippet overlay()}
          <button
            type="button"
            aria-label="Course actions"
            class="ui:relative ui:z-40 ui:flex ui:size-8 ui:items-center ui:justify-center ui:rounded-full ui:border ui:bg-background/80 ui:text-muted-foreground ui:backdrop-blur"
          >
            •••
          </button>
        {/snippet}
      </CourseCard>
    </div>
  {/snippet}
</Story>

<Story name="Certificate view — earned on">
  {#snippet template()}
    <div class="w-80">
      <CourseCard
        href="/courses/modern-web-development"
        title="Modern Web Development with React"
        description="Build fast, interactive user interfaces with React, hooks, and modern JavaScript tooling."
        coverGradient={COVER_GRADIENT}
        certificateEarnedAt="2026-05-14T10:00:00.000Z"
        status="COMPLETED"
        isLMS
        isCertificateView
        {labels}
      />
    </div>
  {/snippet}
</Story>

<Story name="Compliance with status badge">
  {#snippet template()}
    <div class="w-80">
      <CourseCard
        href="/courses/soc2-security-basics"
        title="SOC 2 Security Basics"
        description="Understand SOC 2 trust criteria and how to implement controls within your organization."
        coverGradient={COVER_GRADIENT}
        compliance={{
          statusLabel: 'Compliant',
          statusVariant: 'success',
          dateLabel: 'Compliant until',
          dateValue: 'Jun 20, 2027'
        }}
        status="IN_PROGRESS"
        isLMS
        {labels}
      />
    </div>
  {/snippet}
</Story>

<Story name="Explore — learn more">
  {#snippet template()}
    <div class="w-80">
      <CourseCard
        href="/course/modern-web-development"
        title="Modern Web Development with React"
        description="Build fast, interactive user interfaces with React, hooks, and modern JavaScript tooling."
        coverGradient={COVER_GRADIENT}
        lessonCount={24}
        exerciseCount={12}
        isExplore
        {labels}
      />
    </div>
  {/snippet}
</Story>
