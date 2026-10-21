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
    mockOrgLandingPageProps as mockProps,
    mockLearningPaths
  } from '@cio/ui/custom/org-landing-page';

  const { Story } = defineMeta({
    title: 'Templates/Learning Path Landing Page',
    parameters: {
      layout: 'fullscreen'
    },
    tags: ['autodocs']
  });

  const learningPathProps = {
    ...mockProps,
    learningPaths: mockLearningPaths,
    hasMoreLearningPaths: true
  };

  /**
   * Every theme's org.svelte only renders its "Learning Paths" section when
   * `learningPaths` is a non-empty array (see OrgLandingPageProps) — real org
   * home pages omit it entirely until a `learning_path` API exists. The
   * `learningPathProps` fixture opts each story into the section explicitly,
   * keeping shared preview fixtures unchanged.
   */
</script>

<Story name="Minimal">
  <MinimalLandingPage {...learningPathProps} />
</Story>

<Story name="Bold">
  <BoldLandingPage {...learningPathProps} />
</Story>

<Story name="Classic">
  <ClassicLandingPage {...learningPathProps} />
</Story>

<Story name="SaaS">
  <SaasLandingPage {...learningPathProps} />
</Story>

<Story name="Tech">
  <TechLandingPage {...learningPathProps} />
</Story>

<Story name="Studio">
  <StudioLandingPage {...learningPathProps} />
</Story>

<Story name="Corporate">
  <CorporateLandingPage {...learningPathProps} />
</Story>

<Story name="Terminal">
  <TerminalLandingPage {...learningPathProps} />
</Story>

<Story name="Editorial">
  <EditorialLandingPage {...learningPathProps} />
</Story>

<Story name="Vibrant">
  <VibrantLandingPage {...learningPathProps} />
</Story>

<Story name="Quartz">
  <QuartzLandingPage {...learningPathProps} authAction={{ label: 'Continue', href: '#signin' }} />
</Story>

<!-- No Learning Paths data at all — every theme must omit the section entirely, not show an empty state. -->
<Story name="No Learning Paths (section omitted)">
  <MinimalLandingPage {...learningPathProps} learningPaths={[]} />
</Story>

<Story name="Bold (section omitted)">
  <BoldLandingPage {...learningPathProps} learningPaths={[]} />
</Story>

<Story name="Classic (section omitted)">
  <ClassicLandingPage {...learningPathProps} learningPaths={[]} />
</Story>

<Story name="SaaS (section omitted)">
  <SaasLandingPage {...learningPathProps} learningPaths={[]} />
</Story>

<Story name="Tech (section omitted)">
  <TechLandingPage {...learningPathProps} learningPaths={[]} />
</Story>

<Story name="Studio (section omitted)">
  <StudioLandingPage {...learningPathProps} learningPaths={[]} />
</Story>

<Story name="Corporate (section omitted)">
  <CorporateLandingPage {...learningPathProps} learningPaths={[]} />
</Story>

<Story name="Terminal (section omitted)">
  <TerminalLandingPage {...learningPathProps} learningPaths={[]} />
</Story>

<Story name="Editorial (section omitted)">
  <EditorialLandingPage {...learningPathProps} learningPaths={[]} />
</Story>

<Story name="Vibrant (section omitted)">
  <VibrantLandingPage {...learningPathProps} learningPaths={[]} />
</Story>

<Story name="Quartz (section omitted)">
  <QuartzLandingPage {...learningPathProps} learningPaths={[]} />
</Story>
