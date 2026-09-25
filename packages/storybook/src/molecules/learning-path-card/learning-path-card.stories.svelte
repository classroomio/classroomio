<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { LearningPathCard, type LearningPathCardLabels } from '@cio/ui';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/LearningPathCard',
    component: LearningPathCard,
    parameters: { layout: 'centered', controls: { include: FIELDS } },
    tags: ['autodocs']
  });

  const labels: LearningPathCardLabels = {
    badge: 'Learning Path',
    course: 'course',
    courses: 'courses',
    certificateEarned: 'Certificate earned',
    adminContinueSetup: 'Continue setup',
    adminManage: 'Manage',
    viewCertificate: 'View certificate',
    viewPath: 'View path',
    startLearning: 'Start learning',
    continueLearning: 'Continue learning',
    statusDraft: 'Draft',
    statusActive: 'Active',
    statusArchived: 'Archived',
    progressLabel: 'progress',
    of: 'of',
    coursesCompleted: 'courses completed',
    earnedOn: 'Earned on'
  };

  const COVER_GRADIENT = 'linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815))';
</script>

<Story name="LMS in progress">
  {#snippet template()}
    <div class="w-80">
      <LearningPathCard
        href="/lms/paths/intro-to-web-development"
        name="Full-Stack Web Development Career Path"
        description="Master HTML, CSS, JavaScript, React, and Node.js by building real-world applications step by step."
        coverGradient={COVER_GRADIENT}
        courseCount={8}
        totalHours={42}
        progressPercent={45}
        coursesCompleted={3}
        isLMS
        {labels}
      />
    </div>
  {/snippet}
</Story>

<Story name="LMS completed with certificate">
  {#snippet template()}
    <div class="w-80">
      <LearningPathCard
        href="/lms/paths/intro-to-web-development"
        name="Full-Stack Web Development Career Path"
        description="Master HTML, CSS, JavaScript, React, and Node.js by building real-world applications step by step."
        coverGradient={COVER_GRADIENT}
        courseCount={8}
        totalHours={42}
        progressPercent={100}
        coursesCompleted={8}
        certificateEarned
        isLMS
        {labels}
      />
    </div>
  {/snippet}
</Story>

<Story name="Admin — draft">
  {#snippet template()}
    <div class="w-80">
      <LearningPathCard
        href="/lms/paths/intro-to-web-development"
        name="Full-Stack Web Development Career Path"
        description="Master HTML, CSS, JavaScript, React, and Node.js by building real-world applications step by step."
        coverGradient={COVER_GRADIENT}
        courseCount={4}
        totalHours={26}
        progressPercent={0}
        coursesCompleted={0}
        status="DRAFT"
        isAdmin
        {labels}
      />
    </div>
  {/snippet}
</Story>

<Story name="Admin — active">
  {#snippet template()}
    <div class="w-80">
      <LearningPathCard
        href="/lms/paths/intro-to-web-development"
        name="Full-Stack Web Development Career Path"
        description="Master HTML, CSS, JavaScript, React, and Node.js by building real-world applications step by step."
        coverGradient={COVER_GRADIENT}
        courseCount={8}
        totalHours={42}
        progressPercent={0}
        coursesCompleted={0}
        status="ACTIVE"
        isAdmin
        {labels}
      />
    </div>
  {/snippet}
</Story>

<Story name="Explore — view path CTA">
  {#snippet template()}
    <div class="w-80">
      <LearningPathCard
        href="/lms/paths/intro-to-web-development"
        name="Full-Stack Web Development Career Path"
        description="Master HTML, CSS, JavaScript, React, and Node.js by building real-world applications step by step."
        coverGradient={COVER_GRADIENT}
        courseCount={8}
        totalHours={42}
        progressPercent={0}
        coursesCompleted={0}
        isExplore
        {labels}
      />
    </div>
  {/snippet}
</Story>

<Story name="With cover image">
  {#snippet template()}
    <div class="w-80">
      <LearningPathCard
        href="/lms/paths/intro-to-web-development"
        name="Data Science with Python and Pandas"
        description="Learn data analysis, visualization, and machine learning fundamentals using Python and Pandas."
        coverImage="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=60"
        courseCount={6}
        totalHours={30}
        progressPercent={70}
        coursesCompleted={4}
        isLMS
        {labels}
      />
    </div>
  {/snippet}
</Story>
