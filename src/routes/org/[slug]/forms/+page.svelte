<script lang="ts">
  import { Search } from 'carbon-components-svelte';
  import { goto } from '$app/navigation';
  import WhitePaper from 'carbon-icons-svelte/lib/WhitePaper.svelte';
  import ChevronSort from 'carbon-icons-svelte/lib/ChevronSort.svelte';
  import Table from 'carbon-icons-svelte/lib/Table.svelte';
  import Folder from 'carbon-icons-svelte/lib/Folder.svelte';

  import { currentOrgPath } from '$lib/utils/store/org';
  import { forms } from './store';

  let uuid;
  let searchValue: string | null = '';

  function handleButtonClick(uuid: number | string) {
    goto(`${$currentOrgPath}/forms/${uuid}`);
    console.log(`Button clicked with ID: ${uuid}`);
  }
</script>

<div class="w-[95%]">
  <nav class="flex justify-between items-center w-full py-5 px-10">
    <div class="flex items-center gap-3">
      <WhitePaper size={32} class="scale-[1]" />
      <h1 class="font-medium">Forms</h1>
    </div>
    <div class="w-[70%] flex relative">
      <Search
        class="dark:text-slate-950 border-0 bg-zinc-100 w-full rounded-md"
        placeholder="Search people"
        bind:value={searchValue}
      />
    </div>
    <div class="flex items-center gap-3">
      <p class="px-3 py-1 rounded-full bg-primary-700 text-white text-base">T</p>
    </div>
  </nav>

  <div class="mt-10 px-10">
    <div class="flex justify-between">
      <p class="font-medium">Start a new form</p>
      <button class="font-medium flex gap-3 px-5 py-2 rounded-md hover:bg-gray-200"
        >Template gallery <ChevronSort /></button
      >
    </div>
    <div class="mt-5 flex flex-wrap items-center gap-x-32 gap-y-14">
      <button class="w-[200px] h-[20vh] border rounded-md hover:scale-105 transition-all">
        <img
          src="https://ssl.gstatic.com/docs/templates/thumbnails/forms-blank-googlecolors.png"
          alt=""
          class="w-full h-full object-cover rounded-md"
        />
        <h4>Blank</h4>
      </button>

      {#each $forms as template (template.id)}
        <button
          class="w-[200px] h-[20vh] border rounded-md hover:scale-105 transition-all"
          on:click={() => handleButtonClick(template.id)}
        >
          <img
            src={template.imgUrl}
            alt={template.name}
            class="w-full h-full object-cover rounded-md"
          />
          <h4>{template.name}</h4>
        </button>
      {/each}
    </div>
  </div>

  <div class="mt-[7%] px-10">
    <div class="flex items-center justify-between">
      <h4>Recent Forms</h4>
      <h4>Owner by anyone</h4>
      <div class="flex gap-5 items-center">
        <Table size={24} class="cursor-pointer" />
        <h4 class="cursor-pointer">A/Z</h4>
        <Folder size={24} class="cursor-pointer" />
      </div>
    </div>
    <div class="mt-4 flex items-center justify-between">
      {#each $forms as template (template.id)}
        <button
          class="w-[200px] h-[20vh] border rounded-md hover:scale-105 transition-all"
          on:click={() => handleButtonClick(template.id)}
        >
          <img
            src={template.imgUrl}
            alt={template.name}
            class="w-full h-full object-cover rounded-md"
          />
          <h4>{template.name}</h4>
        </button>
      {/each}
    </div>
  </div>
</div>
