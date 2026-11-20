<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { StepProgress } from '@cio/ui/custom/step-progress';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/StepProgress',
    component: StepProgress,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="FirstStep">
  {#snippet template()}
    <div class="w-[560px]">
      <StepProgress current={1} total={6} stepText="Step 1 of 6" label="Account" ariaLabel="Onboarding progress" />
    </div>
  {/snippet}
</Story>

<Story name="MiddleStep">
  {#snippet template()}
    <div class="w-[560px]">
      <StepProgress
        current={3}
        total={6}
        stepText="Step 3 of 6"
        label="Your business"
        ariaLabel="Onboarding progress"
      />
    </div>
  {/snippet}
</Story>

<Story name="LastStep">
  {#snippet template()}
    <div class="w-[560px]">
      <StepProgress current={6} total={6} stepText="Step 6 of 6" label="Build" ariaLabel="Onboarding progress" />
    </div>
  {/snippet}
</Story>

<Story name="WithoutBuilderStep">
  {#snippet template()}
    <div class="w-[560px]">
      <StepProgress current={5} total={5} stepText="Step 5 of 5" label="Customise" ariaLabel="Onboarding progress" />
    </div>
  {/snippet}
</Story>

<Story name="LabelHiddenOnMobile">
  {#snippet template()}
    <div class="w-[320px]">
      <StepProgress
        current={2}
        total={6}
        stepText="Step 2 of 6"
        label="Verify your email"
        ariaLabel="Onboarding progress"
        hideLabelOnMobile
      />
    </div>
  {/snippet}
</Story>
