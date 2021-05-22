<script>
  // import AddAlt32 from "carbon-icons-svelte/lib/AddAlt32";
  export let href = "";
  export let label = "";
  export let handleClick;
</script>

<a
  class="root bg-blue-700 hover:bg-blue-900 text-white font-bold rounded inline-flex items-center float-right"
  {href}
  on:click={handleClick}
>
  <!-- <AddAlt32 class="carbon-icon fill-current w-4 h-4 mr-1" /> -->
  {label}
</a>

<style lang="scss">
  .root {
    height: fit-content;
    border-radius: 5px;
    padding: 4px 20px;

    &:hover {
      cursor: pointer;
    }
  }

  @media only screen and (max-width: 1002px) {
    a {
      padding: 10px 15px;
    }

    a :global(svg.carbon-icon) {
      margin-right: 0;
    }
  }
</style>
