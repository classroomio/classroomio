<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { DomainInput } from '@cio/ui/custom/domain-input';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/DomainInput',
    component: DomainInput,
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
    <div class="w-[400px]">
      <DomainInput placeholder="example" />
    </div>
  {/snippet}
</Story>

<Story name="SuffixOnly">
  {#snippet template()}
    <div class="w-[400px]">
      <DomainInput prefix="" suffix=".classroomio.com" placeholder="myschool" />
    </div>
  {/snippet}
</Story>

<Story name="Tray">
  {#snippet template()}
    <div class="w-[400px]">
      <DomainInput variant="tray" prefix="" suffix=".classroomio.com" value="northbeam-academy" />
    </div>
  {/snippet}
</Story>

<Story name="TrayWithPrefix">
  {#snippet template()}
    <div class="w-[400px]">
      <DomainInput variant="tray" prefix="https://" suffix=".classroomio.com" placeholder="myschool" />
    </div>
  {/snippet}
</Story>

<Story name="Disabled">
  {#snippet template()}
    <div class="w-[400px]">
      <DomainInput variant="tray" prefix="" suffix=".classroomio.com" value="northbeam" disabled />
    </div>
  {/snippet}
</Story>
