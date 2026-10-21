<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { LearningPathCard, mockLearningPaths } from '@cio/ui/custom/org-landing-page';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/LearningPathCard',
    component: LearningPathCard,
    parameters: { layout: 'centered', controls: { include: FIELDS } },
    tags: ['autodocs']
  });

  const [PAID_PATH, FREE_PATH] = mockLearningPaths;
</script>

<Story name="Paid, with certificate (no detail link)">
  {#snippet template()}
    <div class="w-96">
      <LearningPathCard path={PAID_PATH} />
    </div>
  {/snippet}
</Story>

<Story name="Free">
  {#snippet template()}
    <div class="w-96">
      <LearningPathCard path={FREE_PATH} />
    </div>
  {/snippet}
</Story>

<Story name="No cover image">
  {#snippet template()}
    <div class="w-96">
      <LearningPathCard path={{ ...PAID_PATH, logo: null }} />
    </div>
  {/snippet}
</Story>

<Story name="Links disabled">
  {#snippet template()}
    <div class="w-96">
      <LearningPathCard path={PAID_PATH} disableCourseLinks />
    </div>
  {/snippet}
</Story>
