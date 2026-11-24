<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { ProductTour, type ProductTourLabels, type ProductTourStep } from '@cio/ui/custom/product-tour';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/ProductTour',
    component: ProductTour,
    parameters: {
      layout: 'fullscreen',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onStepComplete: { control: false },
      onFinish: { control: false }
    },
    tags: ['autodocs']
  });

  const labels: ProductTourLabels = {
    counter: (position, total) => `${position} of ${total}`,
    next: 'Next',
    back: 'Back',
    done: 'Done',
    skip: 'Skip tour',
    region: 'Product tour'
  };

  const steps: ProductTourStep[] = [
    {
      id: 'list',
      target: '[data-testid="story-tour-list"]',
      title: 'Explore your courses',
      body: 'Your starter courses live here. They stay as drafts until you publish them.'
    },
    {
      id: 'open',
      target: '[data-testid="story-tour-card"]',
      title: 'Open a course',
      body: 'Open the first course to see its lessons and edit them.',
      hint: 'Click the course to continue',
      advanceOnTargetClick: true
    },
    {
      id: 'missing',
      target: '[data-testid="story-tour-missing"]',
      title: 'Hidden step',
      body: 'This target is not on the page, so the step is skipped.'
    },
    {
      id: 'academy',
      target: '[data-testid="story-tour-academy"]',
      title: 'Preview your academy',
      body: 'Open your academy to see what learners see.'
    }
  ];
</script>

{#snippet page()}
  <div class="flex min-h-[520px] flex-col gap-6 p-6">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Courses</h1>
      <button data-testid="story-tour-academy" class="rounded-md border px-3 py-1.5 text-sm">Open academy</button>
    </div>
    <div data-testid="story-tour-list" class="grid grid-cols-2 gap-4 rounded-lg border p-4">
      <button data-testid="story-tour-card" class="rounded-md border p-6 text-start text-sm">First course</button>
      <div class="rounded-md border p-6 text-sm">Second course</div>
    </div>
  </div>
{/snippet}

<Story name="FirstStep">
  {#snippet template()}
    {@render page()}
    <ProductTour {steps} {labels} open completedStepIds={[]} />
  {/snippet}
</Story>

<Story name="MiddleStepWithHiddenTarget">
  {#snippet template()}
    {@render page()}
    <ProductTour {steps} {labels} open completedStepIds={['list']} />
  {/snippet}
</Story>

<Story name="LastStep">
  {#snippet template()}
    {@render page()}
    <ProductTour {steps} {labels} open completedStepIds={['list', 'open']} />
  {/snippet}
</Story>

<Story name="Compact" parameters={{ viewport: { defaultViewport: 'mobile1' } }}>
  {#snippet template()}
    {@render page()}
    <ProductTour {steps} {labels} open completedStepIds={[]} />
  {/snippet}
</Story>

<Story name="Closed">
  {#snippet template()}
    {@render page()}
    <ProductTour {steps} {labels} open={false} />
  {/snippet}
</Story>
