<script>
  // import ChevronDown24 from "carbon-icons-svelte/lib/ChevronDown24";

  export let options = [];
  export let handleOptionClick;

  let open = false;

  function onClick(optionIndex) {
    return () => {
      open = !open;
      handleOptionClick(optionIndex);
    };
  }

  function onBlur() {
    // In case an option was clicked, let's wait for the on:click of that button before we close
    setTimeout(() => (open = false), 100);
  }
</script>

<div class="relative">
  <button
    class="flex flex-row items-center border rounded-lg border-grey py-2 px-3 focus:outline-none focus:border-gray-400 focus:bg-gray-200"
    on:click={() => (open = !open)}
    on:blur={onBlur}
  >
    <slot />
    <!-- <ChevronDown24 class="ml-2" /> -->
  </button>

  {#if open}
    <div
      class="dropdown w-48 bg-white border border-grey rounded-lg mt-2 py-2 absolute -top-0.5"
    >
      {#each options as option, index}
        <button
          class="block px-4 py-2 border-b w-full"
          on:click={onClick(index)}
        >
          {option}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .dropdown {
    box-shadow: 0px 5px 5px -3px rgb(0 0 0 / 20%),
      0px 8px 10px 1px rgb(0 0 0 / 14%), 0px 3px 14px 2px rgb(0 0 0 / 12%);
  }
</style>
