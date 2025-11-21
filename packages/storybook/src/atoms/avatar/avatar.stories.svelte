<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Avatar, AvatarImage, AvatarFallback } from '@cio/ui/base/avatar';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Atom/Avatar',
    component: Avatar,
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
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  {/snippet}
</Story>

<Story name="Fallback">
  {#snippet template()}
    <Avatar>
      <AvatarImage src="https://invalid-url.com/image.png" alt="@user" />
      <AvatarFallback>AB</AvatarFallback>
    </Avatar>
  {/snippet}
</Story>

<Story name="Custom Size">
  {#snippet template()}
    <Avatar class="h-20 w-20">
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  {/snippet}
</Story>
