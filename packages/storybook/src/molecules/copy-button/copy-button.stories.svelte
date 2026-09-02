<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';

  import { CopyButton } from '@cio/ui/base/copy-button';
  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';
  import * as InputGroup from '@cio/ui/base/input-group';

  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/CopyButton',
    component: CopyButton,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  let textToCopy = $state('Hello, World!');
  let copiedText = $state('');
</script>

<Story name="Default">
  {#snippet template()}
    <CopyButton text="Copy this text to clipboard" />
  {/snippet}
</Story>

<Story name="With Text">
  {#snippet template()}
    <CopyButton text="npm install @cio/ui" variant="outline">Copy Command</CopyButton>
  {/snippet}
</Story>

<Story name="Variants">
  {#snippet template()}
    <div class="flex flex-col items-start gap-4">
      <CopyButton text="Default variant" variant="default" />
      <CopyButton text="Outline variant" variant="outline" />
      <CopyButton text="Secondary variant" variant="secondary" />
      <CopyButton text="Ghost variant" variant="ghost" />
      <CopyButton text="Destructive variant" variant="destructive" />
    </div>
  {/snippet}
</Story>

<Story name="With Input Group">
  {#snippet template()}
    <InputGroup.Root class="w-96">
      <InputGroup.Input value="https://classroomio.com/courses/123" readonly />
      <InputGroup.Addon align="inline-end">
        <CopyButton text="https://classroomio.com/courses/123" size="icon-sm" />
      </InputGroup.Addon>
    </InputGroup.Root>
  {/snippet}
</Story>

<Story name="Reactive Text">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <InputGroup.Root>
        <InputGroup.Input bind:value={textToCopy} placeholder="Enter text to copy" />
        <InputGroup.Addon align="inline-end">
          <CopyButton text={textToCopy} size="icon-sm" />
        </InputGroup.Addon>
      </InputGroup.Root>
      <div class="ui:text-muted-foreground text-sm">
        <p>Text to copy: <code class="ui:bg-muted rounded px-2 py-1">{textToCopy}</code></p>
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Code Block">
  {#snippet template()}
    <div class="ui:bg-muted/50 w-full max-w-2xl rounded-lg border p-4">
      <div class="mb-2 flex items-center justify-between">
        <span class="text-sm font-medium">Installation</span>
        <CopyButton
          text="pnpm add @cio/ui"
          size="sm"
          variant="ghost"
          onCopy={(status) => {
            if (status === 'success') {
              copiedText = 'pnpm add @cio/ui';
            }
          }}
        >
          Copy
        </CopyButton>
      </div>
      <pre class="text-sm"><code>pnpm add @cio/ui</code></pre>
      {#if copiedText}
        <p class="mt-2 text-green-600">Last copied: {copiedText}</p>
      {/if}
    </div>
  {/snippet}
</Story>
