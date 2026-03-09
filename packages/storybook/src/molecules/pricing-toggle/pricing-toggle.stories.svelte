<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { PricingToggle } from '@cio/ui/custom/pricing-toggle';

  const { Story } = defineMeta({
    title: 'Molecules/PricingToggle',
    component: PricingToggle,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <PricingToggle />
  {/snippet}
</Story>

<Story name="Yearly Active">
  {#snippet template()}
    <PricingToggle isYearly={true} />
  {/snippet}
</Story>

<Story name="Custom Labels">
  {#snippet template()}
    <PricingToggle monthlyLabel="Pay Monthly" yearlyLabel="Pay Yearly" saveLabel="Get 20% Off" />
  {/snippet}
</Story>

<Story name="No Save Badge">
  {#snippet template()}
    <PricingToggle saveLabel="" />
  {/snippet}
</Story>
