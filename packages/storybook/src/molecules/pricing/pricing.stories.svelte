<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Pricing } from '@cio/ui';
  import { PLANS } from '@cio/utils/plans';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/Pricing',
    component: Pricing.Root,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      plans: {
        control: 'object',
        description: 'The plans to display'
      },
      isLoadingPlan: {
        control: 'text',
        description: 'The name of the plan currently loading'
      },
      isYearlyPlan: {
        control: 'boolean',
        description: 'Whether to show yearly or monthly prices'
      },
      onSelectPlan: {
        action: 'onSelectPlan',
        description: 'Callback when a plan is selected'
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default" args={{ plans: PLANS }}>
  {#snippet template(args)}
    <div class="ui:w-[1000px]">
      <Pricing.Root {...args} />
    </div>
  {/snippet}
</Story>
