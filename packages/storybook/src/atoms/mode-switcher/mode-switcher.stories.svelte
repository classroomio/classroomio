<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { ModeSwitcher } from '@cio/ui/base/dark-mode';

  const { Story } = defineMeta({
    title: 'Atom/Mode Switcher',
    component: ModeSwitcher,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <div class="flex flex-col items-center gap-4">
      <p class="text-muted-foreground text-sm">Click to toggle dark/light mode</p>
      <ModeSwitcher />
    </div>
  {/snippet}
</Story>
