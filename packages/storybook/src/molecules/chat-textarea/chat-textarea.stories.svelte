<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { ChatTextarea } from '@cio/ui';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/ChatTextarea',
    component: ChatTextarea,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  const sampleItems = [
    { id: '1', label: 'Introduction to Programming', type: 'lesson' },
    { id: '2', label: 'Variables and Data Types', type: 'lesson' },
    { id: '3', label: 'Quiz: Variables', type: 'exercise' },
    { id: '4', label: 'Control Flow', type: 'lesson' },
    { id: '5', label: 'Practice: Loops', type: 'exercise' },
    { id: '6', label: 'Functions and Scope', type: 'lesson' },
    { id: '7', label: 'Final Assessment', type: 'exercise' }
  ];
</script>

<script lang="ts">
  import { LessonIcon, ExerciseIcon } from '@cio/ui/custom/moving-icons';
  import { Button } from '@cio/ui/base/button';
  import SendIcon from '@lucide/svelte/icons/send';
  import PaperclipIcon from '@lucide/svelte/icons/paperclip';
  import SquareIcon from '@lucide/svelte/icons/square';

  let value = $state('');
  let sentMessages: string[] = $state([]);
  let isStreaming = $state(false);

  const MENTION_REGEX = /@\[([^\]]+)\]\((lesson|exercise):([a-zA-Z0-9_-]+)\)/g;

  function renderMentionHtml(text: string): string {
    const escaped = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return escaped.replace(MENTION_REGEX, (_match, title, type) => {
      const emoji = type === 'exercise' ? '📝' : '📖';

      return `<span style="background: hsl(var(--primary) / 0.15); padding: 1px 6px; border-radius: 4px; font-weight: 500;">${emoji} ${title}</span>`;
    });
  }

  function handleSend() {
    if (!value.trim()) return;

    sentMessages = [...sentMessages, value];
    value = '';
  }
</script>

<Story name="Default">
  {#snippet template()}
    <div style="width: 360px;">
      <ChatTextarea
        bind:value
        mentionItems={sampleItems}
        onSubmit={handleSend}
        placeholder="Ask the AI assistant... (type @ to mention)"
        typeLabel={(item) => (item.type === 'exercise' ? 'Exercise' : 'Lesson')}
        emptyMessage="No matching content"
      >
        {#snippet icon({ item })}
          {#if item.type === 'exercise'}
            <ExerciseIcon size={14} />
          {:else}
            <LessonIcon size={14} />
          {/if}
        {/snippet}

        {#snippet actions()}
          <button class="ui:text-muted-foreground hover:ui:bg-muted ui:rounded-md ui:p-1.5 ui:transition-colors">
            <PaperclipIcon size={16} />
          </button>
          <div class="ui:flex-1"></div>
          <Button size="icon" variant="default" onclick={handleSend} disabled={!value.trim()} class="ui:size-7">
            <SendIcon size={14} />
          </Button>
        {/snippet}
      </ChatTextarea>
      <p class="ui:text-muted-foreground ui:mt-2 ui:text-xs">
        Press Enter to send. Current value: <code class="ui:text-xs">{value || '(empty)'}</code>
      </p>
    </div>
  {/snippet}
</Story>

<Story name="With Sent Messages">
  {#snippet template()}
    <div
      style="width: 380px; border: 1px solid hsl(var(--border)); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; height: 400px; background: hsl(var(--background));"
    >
      <div style="flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
        {#if sentMessages.length === 0}
          <p class="ui:text-muted-foreground" style="text-align: center; font-size: 13px; margin-top: 40px;">
            Type <kbd class="ui:bg-muted" style="padding: 1px 5px; border-radius: 4px; font-size: 12px;">@</kbd> to mention
            a lesson or exercise, then press Enter to send.
          </p>
        {/if}
        {#each sentMessages as msg, index (index)}
          <div
            style="align-self: flex-end; max-width: 85%; background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 8px; padding: 8px 12px; font-size: 14px;"
          >
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html renderMentionHtml(msg)}
          </div>
        {/each}
      </div>

      <div style="border-top: 1px solid hsl(var(--border)); padding: 8px;">
        <ChatTextarea
          bind:value
          mentionItems={sampleItems}
          onSubmit={handleSend}
          placeholder="Ask the AI assistant..."
          typeLabel={(item) => (item.type === 'exercise' ? 'Exercise' : 'Lesson')}
          emptyMessage="No matching content"
        >
          {#snippet icon({ item })}
            {#if item.type === 'exercise'}
              <ExerciseIcon size={14} />
            {:else}
              <LessonIcon size={14} />
            {/if}
          {/snippet}

          {#snippet actions()}
            <button class="ui:text-muted-foreground hover:ui:bg-muted ui:rounded-md ui:p-1.5 ui:transition-colors">
              <PaperclipIcon size={16} />
            </button>
            <div class="ui:flex-1"></div>
            <Button size="icon" variant="default" onclick={handleSend} disabled={!value.trim()} class="ui:size-7">
              <SendIcon size={14} />
            </Button>
          {/snippet}
        </ChatTextarea>
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Without Mentions">
  {#snippet template()}
    <div style="width: 360px;">
      <ChatTextarea bind:value placeholder="Type a message..." onSubmit={handleSend} />
    </div>
  {/snippet}
</Story>

<Story name="Disabled">
  {#snippet template()}
    <div style="width: 360px;">
      <ChatTextarea value="Streaming response..." disabled placeholder="Ask the AI assistant...">
        {#snippet actions()}
          <button class="ui:text-muted-foreground ui:rounded-md ui:p-1.5 ui:opacity-50" disabled>
            <PaperclipIcon size={16} />
          </button>
          <div class="ui:flex-1"></div>
          <Button size="icon" variant="outline" class="ui:size-7">
            <SquareIcon size={12} />
          </Button>
        {/snippet}
      </ChatTextarea>
    </div>
  {/snippet}
</Story>
