<script>
  import AddAlt32 from "carbon-icons-svelte/lib/AddAlt32";
  export let href;
  export let label = "";
</script>

<a
  class="root bg-blue-700 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded inline-flex items-center float-right"
  {href}
>
  <AddAlt32 class="carbon-icon fill-current w-4 h-4 mr-1" />
  {label}
</a>

<style>
  .root {
    height: fit-content;
    border-radius: 30px;
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
