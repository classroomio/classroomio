<script lang="ts">
  import { NodeViewWrapper, NodeViewContent } from 'svelte-tiptap';
  import type { NodeViewProps } from '@tiptap/core';
  import { Button, buttonVariants } from '$src/base/button';
  const { node, updateAttributes, extension }: NodeViewProps = $props();
  import * as DropdownMenu from '$src/base/dropdown-menu';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Check from '@lucide/svelte/icons/check';
  import Copy from '@lucide/svelte/icons/copy';

  let preRef = $state<HTMLPreElement>();

  let isCopying = $state(false);

  const languages: string[] = extension.options.lowlight.listLanguages().sort();

  let defaultLanguage = $state(node.attrs.language);

  function copyCode() {
    if (!preRef) return;
    isCopying = true;
    navigator.clipboard.writeText(preRef.innerText);
    setTimeout(() => {
      isCopying = false;
    }, 1000);
  }
</script>

<NodeViewWrapper class="code-wrapper" draggable={false} spellcheck={false}>
  <div class="code-wrapper-tile" contenteditable="false">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        contenteditable="false"
        class={buttonVariants({
          variant: 'ghost',
          size: 'sm',
          class: 'text-muted-foreground h-4 rounded px-1 py-2 text-xs'
        })}
        >{defaultLanguage}
        <ChevronDown class="!size-2" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content class="h-96 w-40 overflow-auto" contenteditable="false">
        {#each languages as language (language)}
          <DropdownMenu.Item
            contenteditable="false"
            data-current={defaultLanguage === language}
            class="data-[current=true]:bg-muted"
            textValue={language}
            onclick={() => {
              defaultLanguage = language;
              updateAttributes({ language: defaultLanguage });
            }}
          >
            <span>{language}</span>
            {#if defaultLanguage === language}
              <Check class="ml-auto" />
            {/if}
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
    <Button variant="ghost" class="text-muted-foreground size-4 p-0" onclick={copyCode}>
      {#if isCopying}
        <Check class="size-3 text-green-500" />
      {:else}
        <Copy class="size-3" />
      {/if}
    </Button>
  </div>
  <pre bind:this={preRef} draggable={false}>
		<NodeViewContent as="code" class={`language-${defaultLanguage}`} {...node.attrs} />
	</pre>
</NodeViewWrapper>
