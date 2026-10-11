<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { ChangelogCover } from '@cio/ui/custom/changelog-cover';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/ChangelogCover',
    component: ChangelogCover,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="ShortTitle" args={{ title: 'Students Learning Progress', footer: 'Jul 16, 2026' }}>
  {#snippet template(args)}
    <div class="w-120 max-w-full">
      <ChangelogCover {...args} />
    </div>
  {/snippet}
</Story>

<Story
  name="MediumTitle"
  args={{ title: 'Set Academy Language, Exercise improvements and more', footer: 'Oct 5, 2026' }}
>
  {#snippet template(args)}
    <div class="w-120 max-w-full">
      <ChangelogCover {...args} />
    </div>
  {/snippet}
</Story>

<Story
  name="LongTitle"
  args={{
    title: 'Course templates, course members, cohorts and certificates in the API, and more',
    footer: 'Sep 28, 2026'
  }}
>
  {#snippet template(args)}
    <div class="w-120 max-w-full">
      <ChangelogCover {...args} />
    </div>
  {/snippet}
</Story>

<Story
  name="VeryLongTitleIsCut"
  args={{
    title:
      'Another improvement that keeps going and going with far more words than any changelog title should ever carry on a cover image, and more',
    footer: 'Sep 21, 2026'
  }}
>
  {#snippet template(args)}
    <div class="w-120 max-w-full">
      <ChangelogCover {...args} />
    </div>
  {/snippet}
</Story>

<Story name="CustomLabelNoFooter" args={{ title: 'Invite links', label: 'Release notes' }}>
  {#snippet template(args)}
    <div class="w-120 max-w-full">
      <ChangelogCover {...args} />
    </div>
  {/snippet}
</Story>

<Story
  name="CroppedWide"
  args={{ title: 'Set Academy Language, Exercise improvements and more', footer: 'Oct 5, 2026' }}
>
  {#snippet template(args)}
    <div class="aspect-[16/7] w-120 max-w-full overflow-hidden rounded-md border">
      <ChangelogCover {...args} />
    </div>
  {/snippet}
</Story>

<Story name="Thumbnail" args={{ title: 'Custom Favicons & Personalised OG Images', footer: 'Jul 18, 2026' }}>
  {#snippet template(args)}
    <div class="aspect-video w-60 max-w-full overflow-hidden rounded-md border">
      <ChangelogCover {...args} />
    </div>
  {/snippet}
</Story>
