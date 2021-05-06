<script>
  import AddComment20 from "carbon-icons-svelte/lib/AddComment20";
</script>

<a
  class="root bg-blue-700 hover:bg-blue-900 text-white font-bold py-3 px-8 rounded inline-flex items-center float-right"
  href="/ask"
>
  <AddComment20 class="carbon-icon fill-current w-4 h-4 mr-2" />
  <span>Спросить</span>
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
    a span {
      display: none;
    }

    a :global(svg.carbon-icon) {
      margin-right: 0;
    }
  }
</style>
