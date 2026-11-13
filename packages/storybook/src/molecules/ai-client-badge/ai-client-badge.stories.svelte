<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';

  import { AiClientBadge } from '@cio/ui/custom/ai-client-badge';

  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/AiClientBadge',
    component: AiClientBadge,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      clientName: { control: 'text' }
    },
    args: {
      clientName: 'Claude'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Claude" args={{ clientName: 'Claude' }} />

<Story name="ChatGPT" args={{ clientName: 'ChatGPT' }} />

<Story name="Loose matching">
  {#snippet template()}
    <div class="flex flex-col items-start gap-2">
      <AiClientBadge clientName="claude-ai" />
      <AiClientBadge clientName="Claude Code" />
      <AiClientBadge clientName="openai-mcp" />
    </div>
  {/snippet}
</Story>

<Story name="Unknown client" args={{ clientName: 'Cursor' }} />
