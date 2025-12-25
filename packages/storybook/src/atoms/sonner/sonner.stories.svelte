<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Toaster, toast } from '@cio/ui/base/sonner';
  import { Button } from '@cio/ui/base/button';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Atom/Sonner (Toast)',
    component: Toaster,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <div class="flex flex-col gap-4">
      <Toaster />
      <Button onclick={() => toast('This is a default toast message')}>Show Toast</Button>
    </div>
  {/snippet}
</Story>

<Story name="Success">
  {#snippet template()}
    <div class="flex flex-col gap-4">
      <Toaster />
      <Button variant="outline" onclick={() => toast.success('Course created successfully!')}>
        Show Success Toast
      </Button>
    </div>
  {/snippet}
</Story>

<Story name="Error">
  {#snippet template()}
    <div class="flex flex-col gap-4">
      <Toaster />
      <Button variant="destructive" onclick={() => toast.error('Failed to save changes. Please try again.')}>
        Show Error Toast
      </Button>
    </div>
  {/snippet}
</Story>

<Story name="Warning">
  {#snippet template()}
    <div class="flex flex-col gap-4">
      <Toaster />
      <Button variant="outline" onclick={() => toast.warning('You have unsaved changes!')}>Show Warning Toast</Button>
    </div>
  {/snippet}
</Story>

<Story name="Info">
  {#snippet template()}
    <div class="flex flex-col gap-4">
      <Toaster />
      <Button variant="secondary" onclick={() => toast.info('New updates are available')}>Show Info Toast</Button>
    </div>
  {/snippet}
</Story>
