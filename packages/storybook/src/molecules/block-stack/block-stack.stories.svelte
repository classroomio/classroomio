<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { BlockStack } from '@cio/ui/custom/block-stack';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/BlockStack',
    component: BlockStack,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  const workspaceBlocks = [
    { kind: 'WORKSPACE', label: 'Your academy', tone: 'primary' as const, width: 'lg' as const },
    { kind: 'FIRST OUTCOME', label: 'Onboard new customers', tone: 'muted' as const, width: 'full' as const },
    { kind: 'TEAM', label: '10-50 people', tone: 'muted' as const, width: 'md' as const },
    { kind: 'ROLE', label: 'Customer Education', tone: 'muted' as const, width: 'lg' as const },
    { kind: 'TODAY', label: 'Help docs', tone: 'muted' as const, width: 'sm' as const }
  ];

  const notchWorkspace = [
    { id: 'workspace', kind: 'WORKSPACE', label: 'Your academy', tone: 'empty' as const, width: 300 },
    { id: 'business', kind: 'YOUR BUSINESS', label: 'northbeam.io', tone: 'blue' as const, width: 340 },
    { id: 'outcome', kind: 'FIRST OUTCOME', label: 'Onboard new customers', tone: 'soft' as const, width: 300 },
    { id: 'team', kind: 'TEAM', label: '10-50 people', tone: 'sand' as const, width: 340 },
    { id: 'role', kind: 'ROLE', label: 'Choose a role', tone: 'empty' as const, width: 300 },
    { id: 'today', kind: 'TODAY', label: 'Choose one', tone: 'empty' as const, width: 340 }
  ];

  const notchCourses = [
    { id: 'c1', kind: 'COURSE', label: 'Getting Started with Northbeam', tone: 'sand' as const, width: 340 },
    { id: 'c2', kind: 'COURSE', label: 'Core Workflows, Step by Step', tone: 'tint' as const, width: 300 },
    { id: 'c3', kind: 'COURSE', label: 'Collaborating with Your Team', tone: 'sand' as const, width: 340 },
    { id: 'ws', kind: 'WORKSPACE', label: 'Northbeam Academy', tone: 'ink' as const, width: 280 }
  ];
</script>

<Story name="WorkspacePreview">
  {#snippet template()}
    <div class="w-[360px]">
      <BlockStack blocks={workspaceBlocks} ariaLabel="Your workspace, 5 of 5 blocks" />
    </div>
  {/snippet}
</Story>

<Story name="WithPlaceholders">
  {#snippet template()}
    <div class="w-[360px]">
      <BlockStack
        blocks={[
          { kind: 'WORKSPACE', label: 'Your academy', width: 'lg' },
          { kind: 'FIRST OUTCOME', label: 'Choose a first outcome', width: 'full' },
          { kind: 'TEAM', label: 'Choose a size', width: 'md' },
          { kind: 'ROLE', label: 'Choose a role', width: 'lg' },
          { kind: 'TODAY', label: 'Choose one', width: 'sm' }
        ]}
        ariaLabel="Your workspace, 1 of 5 blocks"
      />
    </div>
  {/snippet}
</Story>

<Story name="Animated">
  {#snippet template()}
    <div class="w-[360px]">
      <BlockStack blocks={workspaceBlocks} animate ariaLabel="Blocks dropping into place" />
    </div>
  {/snippet}
</Story>

<Story name="SolidTone">
  {#snippet template()}
    <div class="w-[360px]">
      <BlockStack
        blocks={[{ kind: 'COURSE', label: 'Getting Started with Acme', tone: 'solid', width: 'full' }]}
        ariaLabel="One course block"
      />
    </div>
  {/snippet}
</Story>

<Story name="NotchPlaceholders">
  {#snippet template()}
    <div class="w-[340px]">
      <BlockStack variant="notch" size="lg" blocks={notchWorkspace} ariaLabel="Your workspace, 3 of 6 blocks" />
    </div>
  {/snippet}
</Story>

<Story name="NotchSettle">
  {#snippet template()}
    <div class="w-[340px]">
      <BlockStack variant="notch" size="lg" animate="settle" blocks={notchWorkspace} ariaLabel="Blocks settling" />
    </div>
  {/snippet}
</Story>

<Story name="NotchDrop">
  {#snippet template()}
    <div class="w-[340px]">
      <BlockStack variant="notch" animate="drop" blocks={notchCourses} ariaLabel="Courses dropping into place" />
    </div>
  {/snippet}
</Story>

<Story name="NotchAllTones">
  {#snippet template()}
    <div class="w-[340px]">
      <BlockStack
        variant="notch"
        blocks={[
          { kind: 'SAND', label: 'Sand', tone: 'sand', width: 340 },
          { kind: 'TINT', label: 'Tint', tone: 'tint', width: 300 },
          { kind: 'SOFT', label: 'Soft', tone: 'soft', width: 340 },
          { kind: 'BLUE', label: 'Blue', tone: 'blue', width: 300 },
          { kind: 'INK', label: 'Ink', tone: 'ink', width: 340 },
          { kind: 'EMPTY', label: 'Empty', tone: 'empty', width: 300 }
        ]}
        ariaLabel="Every notch tone"
      />
    </div>
  {/snippet}
</Story>
