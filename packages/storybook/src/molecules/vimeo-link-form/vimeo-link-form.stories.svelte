<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VimeoLinkForm } from '@cio/ui/custom/vimeo-link-form';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/VimeoLinkForm',
    component: VimeoLinkForm,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onSubmit: { control: false },
      onInputChange: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<!-- Default Story -->
<Story
  name="Default"
  args={{
    inputLabel: 'Vimeo link',
    inputPlaceholder: 'https://vimeo.com/123456789',
    addButtonLabel: 'Add video',
    invalidVimeoMessage: 'Please enter a valid Vimeo link.'
  }}
>
  {#snippet template(args)}
    <div class="w-135">
      <VimeoLinkForm {...args} />
    </div>
  {/snippet}
</Story>

<!-- Disabled Story -->
<Story
  name="Disabled"
  args={{
    inputLabel: 'Vimeo link',
    inputPlaceholder: 'https://vimeo.com/123456789',
    addButtonLabel: 'Add video',
    invalidVimeoMessage: 'Please enter a valid Vimeo link.',
    disabled: true
  }}
>
  {#snippet template(args)}
    <div class="w-135">
      <VimeoLinkForm {...args} />
    </div>
  {/snippet}
</Story>

<!-- Custom Hint Story -->
<Story
  name="CustomHint"
  args={{
    inputLabel: 'Vimeo video URL',
    inputPlaceholder: 'https://vimeo.com/76979871/d55f0535a3',
    addButtonLabel: 'Attach Vimeo video',
    invalidVimeoMessage: 'Invalid Vimeo URL format.',
    privacyHintPrefix: 'For domain-restricted videos, add',
    privacyHintSuffix: 'to Vimeo privacy settings.'
  }}
>
  {#snippet template(args)}
    <div class="w-135">
      <VimeoLinkForm {...args} />
    </div>
  {/snippet}
</Story>
