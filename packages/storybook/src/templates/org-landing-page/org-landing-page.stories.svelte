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
    TerminalLandingPage
  } from '@cio/ui/custom/org-landing-page';
  import { mockProps } from './fixtures';

  const { Story } = defineMeta({
    title: 'Templates/Org Landing Page',
    parameters: {
      layout: 'fullscreen'
    },
    tags: ['autodocs']
  });
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
