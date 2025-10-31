<script lang="ts">
  import { Button } from '$src/base/button';
  import { cn } from '$src/tools';

  interface Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: Record<string, any>;
  }

  const { props }: Props = $props();

  let scrollContainer = $state<HTMLElement | null>(null);

  let selectedGroupIndex = $state<number>(0);
  let selectedCommandIndex = $state<number>(0);

  const items = $derived.by(() => props.items);

  $effect(() => {
    if (items) {
      selectedGroupIndex = 0;
      selectedCommandIndex = 0;
    }
  });

  $effect(() => {
    const activeItem = document.getElementById(`${selectedGroupIndex}-${selectedCommandIndex}`);
    if (activeItem !== null && scrollContainer !== null) {
      const offsetTop = activeItem.offsetTop;
      const offsetHeight = activeItem.offsetHeight;
      scrollContainer.scrollTop = offsetTop - offsetHeight;
    }
  });

  const selectItem = (groupIndex: number, commandIndex: number) => {
    const command = props.items[groupIndex].commands[commandIndex];
    props.command(command);
  };

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || ((e.ctrlKey || e.metaKey) && e.key === 'j') || e.key === 'Tab') {
      e.preventDefault();
      if (!props.items.length) {
        return false;
      }
      const commands = props.items[selectedGroupIndex].commands;
      let newCommandIndex = selectedCommandIndex + 1;
      let newGroupIndex = selectedGroupIndex;
      if (commands.length - 1 < newCommandIndex) {
        newCommandIndex = 0;
        newGroupIndex = selectedGroupIndex + 1;
      }

      if (props.items.length - 1 < newGroupIndex) {
        newGroupIndex = 0;
      }
      selectedCommandIndex = newCommandIndex;
      selectedGroupIndex = newGroupIndex;
      return true;
    }

    if (e.key === 'ArrowUp' || ((e.ctrlKey || e.metaKey) && e.key === 'k')) {
      e.preventDefault();
      if (!props.items.length) {
        return false;
      }
      let newCommandIndex = selectedCommandIndex - 1;
      let newGroupIndex = selectedGroupIndex;
      if (newCommandIndex < 0) {
        newGroupIndex = selectedGroupIndex - 1;
        newCommandIndex = props.items[newGroupIndex]?.commands.length - 1 || 0;
      }
      if (newGroupIndex < 0) {
        newGroupIndex = props.items.length - 1;
        newCommandIndex = props.items[newGroupIndex].commands.length - 1;
      }
      selectedCommandIndex = newCommandIndex;
      selectedGroupIndex = newGroupIndex;
      return true;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (!props.items.length || selectedGroupIndex === -1 || selectedCommandIndex === -1) {
        return false;
      }
      selectItem(selectedGroupIndex, selectedCommandIndex);
      return true;
    }
    return false;
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if items.length}
  <div
    bind:this={scrollContainer}
    class="bg-popover flex max-h-80 flex-col gap-1 overflow-auto scroll-smooth rounded border"
  >
    {#each items as grp, groupIndex (groupIndex)}
      <span class="text-muted-foreground p-2 text-xs">{grp.title}</span>

      {#each grp.commands as command, commandIndex (commandIndex)}
        {@const Icon = command.icon}
        {@const isActive = selectedGroupIndex === groupIndex && selectedCommandIndex === commandIndex}
        <Button
          id={`${groupIndex}-${commandIndex}`}
          variant="ghost"
          class={cn('h-8 w-full justify-start gap-2 rounded-sm', isActive && 'bg-muted')}
          onclick={() => selectItem(groupIndex, commandIndex)}
        >
          <Icon />
          <span>{command.tooltip}</span>
        </Button>
      {/each}
    {/each}
  </div>
{/if}
