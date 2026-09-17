<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CourseListRow, type CourseCardLabels } from '@cio/ui';
  import UserIcon from '@lucide/svelte/icons/user';
  import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import { Badge } from '@cio/ui/base/badge';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/CourseListRow',
    component: CourseListRow,
    parameters: { layout: 'padded', controls: { include: FIELDS } },
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
    <div class="max-w-3xl">
      <CourseListRow
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
    <div class="max-w-3xl">
      <CourseListRow
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
    <div class="max-w-3xl">
      <CourseListRow
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
    <div class="max-w-3xl">
      <CourseListRow
        href="/courses/modern-web-development"
        title="Modern Web Development with React"
        description="Build fast, interactive user interfaces with React, hooks, and modern JavaScript tooling."
        coverGradient={COVER_GRADIENT}
        typeBadge={{
          label: 'Self-paced',
          icon: UserIcon,
          iconClass: 'ui:size-3 ui:shrink-0 ui:text-primary'
        }}
        lessonCount={24}
        exerciseCount={12}
        totalStudents={87}
        isPublished
        isAdmin
        {labels}
      />
    </div>
  {/snippet}
</Story>

<Story name="Admin with tags and overlay">
  {#snippet template()}
    <div class="max-w-3xl">
      <CourseListRow
        href="/courses/modern-web-development"
        title="Modern Web Development with React"
        description="Build fast, interactive user interfaces with React, hooks, and modern JavaScript tooling."
        coverGradient={COVER_GRADIENT}
        typeBadge={{
          label: 'Live class',
          icon: CircleDotIcon,
          iconClass: 'ui:size-3 ui:shrink-0 ui:text-red-600'
        }}
        lessonCount={24}
        exerciseCount={12}
        totalStudents={142}
        isPublished={false}
        isAdmin
        {labels}
      >
        {#snippet overlay()}
          <button
            type="button"
            class="text-muted-foreground hover:bg-muted flex size-7 items-center justify-center rounded-md"
            aria-label="Actions"
          >
            <EllipsisVerticalIcon class="size-4" />
          </button>
        {/snippet}
        {#snippet tags()}
          <div class="flex items-center gap-1.5">
            <Badge variant="outline" class="rounded-full px-2 py-0 text-[10px]">React</Badge>
            <Badge variant="outline" class="rounded-full px-2 py-0 text-[10px]">Frontend</Badge>
          </div>
        {/snippet}
      </CourseListRow>
    </div>
  {/snippet}
</Story>

<Story name="Explore clickable">
  {#snippet template()}
    <div class="max-w-3xl">
      <CourseListRow
        title="Full Stack TypeScript"
        description="Master end-to-end TypeScript from frontend to database."
        coverGradient={COVER_GRADIENT}
        lessonCount={18}
        exerciseCount={6}
        isExplore
        onExploreClick={() => alert('Explore modal opened')}
        {labels}
      />
    </div>
  {/snippet}
</Story>

<Story name="Certificate view">
  {#snippet template()}
    <div class="max-w-3xl">
      <CourseListRow
        href="/courses/modern-web-development/certificates"
        title="Modern Web Development with React"
        description="Build fast, interactive user interfaces with React, hooks, and modern JavaScript tooling."
        coverGradient={COVER_GRADIENT}
        lessonCount={24}
        exerciseCount={12}
        certificateEarnedAt="2026-03-15T00:00:00.000Z"
        status="COMPLETED"
        isCertificateView
        {labels}
      />
    </div>
  {/snippet}
</Story>

<Story name="With part of path">
  {#snippet template()}
    <div class="max-w-3xl">
      <CourseListRow
        href="/courses/modern-web-development"
        title="Modern Web Development with React"
        description="Build fast, interactive user interfaces with React, hooks, and modern JavaScript tooling."
        coverGradient={COVER_GRADIENT}
        lessonCount={24}
        exerciseCount={12}
        progressPercent={60}
        status="IN_PROGRESS"
        partOfPath={{ name: 'Frontend Engineer Path', href: '/lms/paths/frontend-path' }}
        isLMS
        {labels}
      />
    </div>
  {/snippet}
</Story>
