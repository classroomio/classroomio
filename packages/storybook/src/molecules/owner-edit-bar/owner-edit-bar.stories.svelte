<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { OwnerEditBar } from '@cio/ui/custom/owner-edit-bar';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/OwnerEditBar',
    component: OwnerEditBar,
    parameters: {
      layout: 'fullscreen',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  const baseArgs = {
    label: 'Viewing as owner',
    regionLabel: 'Academy owner tools'
  };
</script>

<Story
  name="CourseActions"
  args={{
    ...baseArgs,
    links: [
      { href: '#landing', label: 'Edit landing page', primary: true },
      { href: '#lessons', label: 'Edit lessons' },
      { href: '#settings', label: 'Settings' }
    ]
  }}
>
  {#snippet template(args)}
    <div class="relative h-64" style="transform: translateZ(0)">
      <OwnerEditBar {...args} />
    </div>
  {/snippet}
</Story>

<Story
  name="CatalogActions"
  args={{
    ...baseArgs,
    links: [
      { href: '#courses', label: 'Edit courses', primary: true },
      { href: '#design', label: 'Edit page design' }
    ]
  }}
>
  {#snippet template(args)}
    <div class="relative h-64" style="transform: translateZ(0)">
      <OwnerEditBar {...args} />
    </div>
  {/snippet}
</Story>

<Story name="SingleAction" args={{ ...baseArgs, links: [{ href: '#courses', label: 'Edit courses', primary: true }] }}>
  {#snippet template(args)}
    <div class="relative h-64" style="transform: translateZ(0)">
      <OwnerEditBar {...args} />
    </div>
  {/snippet}
</Story>

<Story
  name="NoPrimary"
  args={{
    ...baseArgs,
    links: [
      { href: '#lessons', label: 'Edit lessons' },
      { href: '#settings', label: 'Settings' }
    ]
  }}
>
  {#snippet template(args)}
    <div class="relative h-64" style="transform: translateZ(0)">
      <OwnerEditBar {...args} />
    </div>
  {/snippet}
</Story>

<Story
  name="NarrowWraps"
  args={{
    ...baseArgs,
    links: [
      { href: '#landing', label: 'Edit landing page', primary: true },
      { href: '#lessons', label: 'Edit lessons' },
      { href: '#settings', label: 'Settings' }
    ]
  }}
>
  {#snippet template(args)}
    <div class="relative h-64 w-[390px] max-w-full overflow-hidden" style="transform: translateZ(0)">
      <OwnerEditBar {...args} />
    </div>
  {/snippet}
</Story>
