<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { TemplateCard } from '@cio/ui';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import UserIcon from '@lucide/svelte/icons/user';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/TemplateCard',
    component: TemplateCard,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onclick: { control: false },
      overlay: { control: false },
      typeBadge: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story
  name="Default"
  args={{
    title: 'Customer Onboarding Academy',
    subtitle: 'Your template · Used Sep 20',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=60',
    imageAlt: 'People working together'
  }}
>
  {#snippet template(args)}
    <div class="w-44">
      <TemplateCard {...args} typeBadge={{ label: 'Self paced', icon: UserIcon }} />
    </div>
  {/snippet}
</Story>

<Story
  name="Global"
  args={{
    title: 'Product Training',
    subtitle: 'Curated template',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=60',
    imageAlt: 'Workshop'
  }}
>
  {#snippet template(args)}
    <div class="w-44">
      <TemplateCard {...args} />
    </div>
  {/snippet}
</Story>

<Story name="Blank" args={{ blank: true, title: 'Blank course', subtitle: 'Start from scratch' }}>
  {#snippet template(args)}
    <div class="w-44">
      <TemplateCard {...args} />
    </div>
  {/snippet}
</Story>

<Story name="Loading" args={{ loading: true }}>
  {#snippet template(args)}
    <div class="w-44">
      <TemplateCard {...args} />
    </div>
  {/snippet}
</Story>

<Story
  name="Public"
  args={{
    title: 'Open workshop',
    subtitle: 'Curated template',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=60',
    imageAlt: 'Workshop'
  }}
>
  {#snippet template(args)}
    <div class="w-44">
      <TemplateCard {...args} typeBadge={{ label: 'Public', icon: GlobeIcon }} />
    </div>
  {/snippet}
</Story>

<Story name="No image" args={{ title: 'Imageless template', subtitle: 'Your template' }}>
  {#snippet template(args)}
    <div class="w-44">
      <TemplateCard {...args} />
    </div>
  {/snippet}
</Story>

<Story
  name="With menu"
  args={{
    title: 'Customer Onboarding Academy',
    subtitle: 'Your template',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=60',
    imageAlt: 'People working together'
  }}
>
  {#snippet template(args)}
    <div class="w-44">
      <TemplateCard {...args}>
        {#snippet overlay()}
          <span class="ui:bg-background ui:border-border absolute top-2 right-2 rounded-md border px-2 py-1 text-xs">
            ···
          </span>
        {/snippet}
      </TemplateCard>
    </div>
  {/snippet}
</Story>
