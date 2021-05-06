<script>
  import Education16 from "carbon-icons-svelte/lib/Education16";
  import Catalog16 from "carbon-icons-svelte/lib/Catalog16";

  export let classes = [1, 2, 3, 4, 5, 6, 7];
</script>

<div class="classes">
  {#each classes as classData}
    <div class="class">
      <h4 class="class-title">
        <a rel="prefetch" href="classes/1">React.JS 001</a>
      </h4>
      <p>
        Here is some description about the course that you should know. It will
        begin on the first and end on the second of the next month.
      </p>
      <div class="flex mt-3 mb-2">
        <span class="flex mr-2"><Education16 class="mr-2" /> 5</span>
        <span class="flex"><Catalog16 class="mr-2" /> 20</span>
      </div>
    </div>
  {/each}
</div>

<style>
  .classes {
    max-width: 600px;
    margin: 0 auto;
    padding: 0 40px;
  }

  .class {
    border-bottom: 1px solid var(--border-color);
    padding: 5px 0 10px;
  }

  .class-title {
    width: fit-content;
    font-size: 18px;
  }

  span {
    color: #586069;
    font-size: 12px;
    width: 40px;
  }
</style>
