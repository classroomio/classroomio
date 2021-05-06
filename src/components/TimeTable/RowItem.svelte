<script>
  import Edit24 from "carbon-icons-svelte/lib/Edit24";
  import Save24 from "carbon-icons-svelte/lib/Save24";
  import Input from "./Input.svelte";

  export let item, current;
  let editing = false;

  function toggle() {
    editing = !editing;
  }
</script>

<style>
  .rowItem {
    border-right: 1px solid;
    border-bottom: 1px solid;
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    width: 100%;
    min-width: 150px;
  }
  .rowItem button {
    display: none;
    height: fit-content;
  }
  .rowItem:hover button {
    display: block;
    cursor: pointer;
  }

  .rowItemHeader {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .rowItemFooter {
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    align-items: flex-start;
  }
  :global(svg.icon) {
    fill: red;
  }
</style>

<div class="rowItem">
  <div class="rowItemHeader">
    <Input className="small" value={item.lessonType} {editing} />
    <Input className="small alignRight" value={item.lectureHall} {editing} />
  </div>

  <div class="rowItemHeader">
    <Input
      className={`large ${current && 'current'}`}
      value={item.subject}
      {editing} />
  </div>

  <div class="rowItemHeader">
    <div class="rowItemFooter" style="width: 70%">
      <Input className="small" value={item.lecturerOne} {editing} />
      <Input className="small" value={item.lecturerTwo} {editing} />
    </div>
    <button on:click={toggle}>
      {#if editing}
        <Save24 class="icon" />
      {:else}
        <Edit24 class="icon" />
      {/if}
    </button>
  </div>
</div>
