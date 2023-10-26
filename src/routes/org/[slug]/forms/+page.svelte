<script lang="ts">
  import { goto } from '$app/navigation';
  import WhitePaper from 'carbon-icons-svelte/lib/WhitePaper.svelte';
  import Search from 'carbon-icons-svelte/lib/Search.svelte';
  import ChevronSort from 'carbon-icons-svelte/lib/ChevronSort.svelte';
  import Table from 'carbon-icons-svelte/lib/Table.svelte';
  import Folder from 'carbon-icons-svelte/lib/Folder.svelte';

  import { currentOrgPath } from '$lib/utils/store/org';
  import { forms } from './store';

  let uuid;

  function createForm() {
    goto(`${$currentOrgPath}/forms/create`);
  }
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
      <Search size={32} class="scale-[1] px-1 py-2 absolute top-1 left-2 fill-gray-400" />
      <input
        type="search"
        name=""
        id=""
        class="w-full bg-gray-100 border-none outline-none rounded-md pl-10"
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
      <button
        class="w-[200px] h-[20vh] border rounded-md hover:scale-105 transition-all"
        on:click={createForm}
      >
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
            alt={template.templateName}
            class="w-full h-full object-cover rounded-md"
          />
          <h4>{template.templateName}</h4>
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
            alt={template.templateName}
            class="w-full h-full object-cover rounded-md"
          />
          <h4>{template.templateName}</h4>
        </button>
      {/each}
    </div>
  </div>
</div>
