<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    MinimalLandingPage,
    BoldLandingPage,
    ClassicLandingPage,
    SaasLandingPage,
    TechLandingPage,
    StudioLandingPage,
    CorporateLandingPage,
    TerminalLandingPage,
    EditorialLandingPage,
    VibrantLandingPage,
    QuartzLandingPage,
    mockOrgLandingPageProps as mockProps
  } from '@cio/ui/custom/org-landing-page';

  const { Story } = defineMeta({
    title: 'Templates/Learning Path Landing Page',
    parameters: {
      layout: 'fullscreen'
    },
    tags: ['autodocs']
  });

  /**
   * Every theme's org.svelte only renders its "Learning Paths" section when
   * `learningPaths` is a non-empty array (see OrgLandingPageProps) — real org
   * home pages omit it entirely until a `learning_path` API exists. mockProps
   * already carries `mockLearningPaths`, so every story below shows the full
   * home page with that section rendered above Courses, per theme.
   */
</script>

<Story name="Minimal">
  <MinimalLandingPage {...mockProps} />
</Story>

<Story name="Bold">
  <BoldLandingPage {...mockProps} />
</Story>

<Story name="Classic">
  <ClassicLandingPage {...mockProps} />
</Story>

<Story name="SaaS">
  <SaasLandingPage {...mockProps} />
</Story>

<Story name="Tech">
  <TechLandingPage {...mockProps} />
</Story>

<Story name="Studio">
  <StudioLandingPage {...mockProps} />
</Story>

<Story name="Corporate">
  <CorporateLandingPage {...mockProps} />
</Story>

<Story name="Terminal">
  <TerminalLandingPage {...mockProps} />
</Story>

<Story name="Editorial">
  <EditorialLandingPage {...mockProps} />
</Story>

<Story name="Vibrant">
  <VibrantLandingPage {...mockProps} />
</Story>

<Story name="Quartz">
  <QuartzLandingPage {...mockProps} authAction={{ label: 'Continue', href: '#signin' }} />
</Story>

<!-- No Learning Paths data at all — every theme must omit the section entirely, not show an empty state. -->
<Story name="No Learning Paths (section omitted)">
  <MinimalLandingPage {...mockProps} learningPaths={[]} />
</Story>
