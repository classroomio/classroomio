<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Progress } from '@cio/ui/base/progress';

  const { Story } = defineMeta({
    title: 'Atom/Progress',
    component: Progress,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <div class="w-[400px] space-y-4">
      <Progress value={33} />
    </div>
  {/snippet}
</Story>

<Story name="Different Values">
  {#snippet template()}
    <div class="w-[400px] space-y-6">
      <div class="space-y-2">
        <p class="text-sm font-medium">25% Complete</p>
        <Progress value={25} />
      </div>
      <div class="space-y-2">
        <p class="text-sm font-medium">50% Complete</p>
        <Progress value={50} />
      </div>
      <div class="space-y-2">
        <p class="text-sm font-medium">75% Complete</p>
        <Progress value={75} />
      </div>
      <div class="space-y-2">
        <p class="text-sm font-medium">100% Complete</p>
        <Progress value={100} />
      </div>
    </div>
  {/snippet}
</Story>
