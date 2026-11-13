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

<Story name="Clients with a logo">
  {#snippet template()}
    <div class="flex flex-col items-start gap-2">
      <AiClientBadge clientName="Claude" />
      <AiClientBadge clientName="claude-code" />
      <AiClientBadge clientName="ChatGPT" />
      <AiClientBadge clientName="cursor-vscode" />
      <AiClientBadge clientName="opencode" />
      <AiClientBadge clientName="github-copilot-developer" />
      <AiClientBadge clientName="gemini-cli-mcp-client" />
      <AiClientBadge clientName="Zed" />
      <AiClientBadge clientName="warp" />
      <AiClientBadge clientName="Windsurf" />
      <AiClientBadge clientName="amp" />
      <AiClientBadge clientName="Cline" />
    </div>
  {/snippet}
</Story>

<Story name="Clients with a monogram">
  {#snippet template()}
    <div class="flex flex-col items-start gap-2">
      <AiClientBadge clientName="codex-mcp-client" />
      <AiClientBadge clientName="Visual Studio Code" />
      <AiClientBadge clientName="goose-cli" />
      <AiClientBadge clientName="Factory Droid" />
      <AiClientBadge clientName="Devin" />
      <AiClientBadge clientName="kiro-cli" />
      <AiClientBadge clientName="Grok Build" />
      <AiClientBadge clientName="Muse Code" />
    </div>
  {/snippet}
</Story>

<Story name="Unknown client" args={{ clientName: 'My Custom Agent' }} />
