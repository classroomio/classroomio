<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    MinimalCourseLanding,
    BoldCourseLanding,
    ClassicCourseLanding,
    SaasCourseLanding,
    TechCourseLanding,
    StudioCourseLanding,
    CorporateCourseLanding,
    TerminalCourseLanding,
    EditorialCourseLanding,
    VibrantCourseLanding,
    QuartzCourseLanding,
    mockCourseLandingPageProps as mockProps
  } from '@cio/ui/custom/org-landing-page';

  const [firstSection, ...otherSections] = mockProps.curriculum.sections;
  const mixedCurriculum = {
    grouped: true,
    sections: [
      {
        id: 'welcome',
        title: 'Welcome to the course',
        lessons: [{ id: 'welcome', title: 'Welcome to the course' }],
        exerciseCount: 0,
        items: [],
        standalone: 'lesson'
      },
      {
        ...firstSection,
        exerciseCount: (firstSection.exerciseCount ?? 0) + 1,
        items: [
          ...firstSection.lessons.map((lesson) => ({ ...lesson, kind: 'lesson' })),
          { id: 'module-check', title: 'Check your understanding', kind: 'exercise' }
        ]
      },
      {
        id: 'midpoint-quiz',
        title: 'Midpoint quiz',
        lessons: [],
        exerciseCount: 1,
        items: [],
        standalone: 'exercise'
      },
      ...otherSections
    ]
  };
  const mixedProps = { ...mockProps, curriculum: mixedCurriculum };

  const { Story } = defineMeta({
    title: 'Templates/Course Landing Page',
    parameters: {
      layout: 'fullscreen'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Minimal">
  <MinimalCourseLanding {...mockProps} />
</Story>

<Story name="Bold">
  <BoldCourseLanding {...mockProps} />
</Story>

<Story name="Classic">
  <ClassicCourseLanding {...mockProps} />
</Story>

<Story name="SaaS">
  <SaasCourseLanding {...mockProps} />
</Story>

<Story name="Tech">
  <TechCourseLanding {...mockProps} />
</Story>

<Story name="Studio">
  <StudioCourseLanding {...mockProps} />
</Story>

<Story name="Corporate">
  <CorporateCourseLanding {...mockProps} />
</Story>

<Story name="Terminal">
  <TerminalCourseLanding {...mockProps} />
</Story>

<Story name="Editorial">
  <EditorialCourseLanding {...mockProps} />
</Story>

<Story name="Vibrant">
  <VibrantCourseLanding {...mockProps} />
</Story>

<Story name="Quartz">
  <QuartzCourseLanding {...mockProps} authAction={{ label: 'Continue', href: '#signin' }} />
</Story>

<Story name="Quartz · standalone items in the curriculum">
  <QuartzCourseLanding {...mixedProps} authAction={{ label: 'Continue', href: '#signin' }} />
</Story>

<Story name="Minimal · standalone items in the curriculum">
  <MinimalCourseLanding {...mixedProps} />
</Story>

<Story name="Classic · standalone items in the curriculum">
  <ClassicCourseLanding {...mixedProps} />
</Story>

<Story name="Gallery · all themes">
  <div class="flex flex-col">
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Minimal</div>
    <MinimalCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Bold</div>
    <BoldCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Classic</div>
    <ClassicCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">SaaS</div>
    <SaasCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Tech</div>
    <TechCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Studio</div>
    <StudioCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Corporate</div>
    <CorporateCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Terminal</div>
    <TerminalCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Editorial</div>
    <EditorialCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Vibrant</div>
    <VibrantCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Quartz</div>
    <QuartzCourseLanding {...mockProps} />
  </div>
</Story>
