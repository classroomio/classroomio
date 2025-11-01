<script lang="ts">
  import { cn } from '$src/tools';
  import commands from '../commands/toolbar-commands';
  import type { EdraToolbarProps } from '../types';
  import Alignment from './components/toolbar/Alignment.svelte';
  import FontSize from './components/toolbar/FontSize.svelte';
  import Headings from './components/toolbar/Headings.svelte';
  import QuickColors from './components/toolbar/QuickColors.svelte';
  import SearchAndReplace from './components/toolbar/SearchAndReplace.svelte';
  import ToolBarIcon from './components/ToolBarIcon.svelte';

  const { editor, class: className, excludedCommands, children }: EdraToolbarProps = $props();

  const toolbarCommands = Object.keys(commands).filter((key) => !excludedCommands?.includes(key));
</script>

<div class={cn('edra-toolbar', className)}>
  {#if children}
    {@render children()}
  {:else}
    {#each toolbarCommands as cmd (cmd)}
      {#if cmd === 'headings'}
        <Headings {editor} />
      {:else if cmd === 'alignment'}
        <Alignment {editor} />
      {:else}
        {@const commandGroup = commands[cmd]}
        {#each commandGroup as command (command)}
          <ToolBarIcon {editor} {command} />
        {/each}
      {/if}
    {/each}
    <FontSize {editor} />
    <QuickColors {editor} />
    <SearchAndReplace {editor} />
  {/if}
</div>
