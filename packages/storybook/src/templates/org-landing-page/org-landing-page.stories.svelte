<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { MinimalLandingPage, BoldLandingPage, ClassicLandingPage } from '@cio/ui/custom/org-landing-page';
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
