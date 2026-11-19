<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CopyInput } from '@cio/ui/custom/copy-input';
  import * as Field from '@cio/ui/base/field';

  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/CopyInput',
    component: CopyInput,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onCopy: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <div class="w-96">
      <CopyInput value="cio_live_7f3c9a1e5b2d4f8a9c0e1b2d3f4a5b6c" />
    </div>
  {/snippet}
</Story>

<Story name="Custom Labels">
  {#snippet template()}
    <div class="w-96">
      <CopyInput value="https://acme.classroomio.com/invite/abc123" copyLabel="Copy link" copiedLabel="Link copied" />
    </div>
  {/snippet}
</Story>

<Story name="Long Value">
  {#snippet template()}
    <div class="w-80">
      <CopyInput value="cio_live_7f3c9a1e5b2d4f8a9c0e1b2d3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6" />
    </div>
  {/snippet}
</Story>

<Story name="With Field">
  {#snippet template()}
    <div class="w-96">
      <Field.Field>
        <Field.Label>API key</Field.Label>
        <Field.Content>
          <CopyInput value="cio_live_7f3c9a1e5b2d4f8a9c0e1b2d3f4a5b6c" />
        </Field.Content>
        <Field.Description>Copy this key now. It won't be shown again.</Field.Description>
      </Field.Field>
    </div>
  {/snippet}
</Story>
