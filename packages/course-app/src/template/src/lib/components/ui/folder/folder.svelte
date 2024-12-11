<script lang="ts">
  import { slide } from 'svelte/transition';
  import File from './file.svelte';
  import Self from './folder.svelte';

  interface Props {
    name: string;
    files: any[];
    onFileClick: () => void;
  }

  let { name, files, onFileClick }: Props = $props();

  let expanded = $state(true);

  function toggle() {
    expanded = !expanded;
  }
</script>

<button
  onclick={toggle}
  class="w-full flex items-center text-start gap-2 text-sm font-medium border-none outline-none bg-transparent capitalize"
>
  {#if expanded}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="border-none outline-none"
      ><path
        d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"
      /></svg
    >
  {:else}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="border-none outline-none"
      ><path
        d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      /></svg
    >
  {/if}
  <span class="w-[90%]">{name}</span>
</button>

{#if expanded}
  <ul
    transition:slide={{ duration: 300 }}
    class="pl-2 ml-2 mb-4 mt-0 list-none border-l border-black"
  >
    {#each files as file}
      <li class="py-[0.2em] px-[1px]">
        {#if file.type === 'folder'}
          <Self {...file} {onFileClick} />
        {:else}
          <File {...file} onClick={onFileClick} />
        {/if}
      </li>
    {/each}
  </ul>
{/if}
