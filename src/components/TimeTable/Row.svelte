<script>
  import RowItem from "./RowItem.svelte";

  export let items, current;
</script>

<div class="rowRoot">
  {#each items as item, i}
    <RowItem {item} current={i === 3 && current} />
  {/each}
</div>

<style>
  .rowRoot {
    display: flex;
    width: 100%;
    justify-content: space-evenly;
    height: 150px;
  }
</style>
