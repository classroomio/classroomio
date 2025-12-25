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
    <div class="ui:flex ui:flex-col ui:gap-4 ui:items-start">
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
    <InputGroup.Root class="ui:w-96">
      <InputGroup.Input value="https://classroomio.com/courses/123" readonly />
      <InputGroup.Addon align="inline-end">
        <CopyButton text="https://classroomio.com/courses/123" size="icon-sm" />
      </InputGroup.Addon>
    </InputGroup.Root>
  {/snippet}
</Story>

<Story name="Reactive Text">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <InputGroup.Root>
        <InputGroup.Input bind:value={textToCopy} placeholder="Enter text to copy" />
        <InputGroup.Addon align="inline-end">
          <CopyButton text={textToCopy} size="icon-sm" />
        </InputGroup.Addon>
      </InputGroup.Root>
      <div class="ui:text-sm ui:text-muted-foreground">
        <p>Text to copy: <code class="ui:bg-muted ui:px-2 ui:py-1 ui:rounded">{textToCopy}</code></p>
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Code Block">
  {#snippet template()}
    <div class="ui:rounded-lg ui:border ui:bg-muted/50 ui:p-4 ui:w-full ui:max-w-2xl">
      <div class="ui:flex ui:items-center ui:justify-between ui:mb-2">
        <span class="ui:text-sm ui:font-medium">Installation</span>
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
      <pre class="ui:text-sm"><code>pnpm add @cio/ui</code></pre>
      {#if copiedText}
        <p class="ui:mt-2 ui:text-green-600">Last copied: {copiedText}</p>
      {/if}
    </div>
  {/snippet}
</Story>
