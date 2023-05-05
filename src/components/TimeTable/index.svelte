<script>
  import Star24 from 'carbon-icons-svelte/lib/Star24';
  import StarFilled24 from 'carbon-icons-svelte/lib/StarFilled24';
  import Link24 from 'carbon-icons-svelte/lib/Link24';
  import Row from './Row.svelte';
  import data from './data';

  let starred = false;
</script>

<div class="sub-header flex justify-between mb-2">
  <h4 class="dark:text-white title">АИ-153</h4>
  <div class="flex justify-evenly items-center">
    {#if starred}
      <StarFilled24
        class="clickables mr-5 text-sm"
        on:click={() => (starred = !starred)}
        focusable="true"
        tabindex={0}
      />
    {:else}
      <Star24
        class="clickables mr-5 text-sm"
        on:click={() => (starred = !starred)}
        focusable="true"
        tabindex="{1}/"
      />
    {/if}

    <Link24 class="clickables mr-5 text-sm" />
  </div>
</div>
<div class="container">
  <div class="col">
    <div class="colItem">Пн</div>
    <div class="colItem">Вт</div>
    <div class="colItem">Ср</div>
    <div class="colItem">Чт</div>
    <div class="colItem">Пя</div>
  </div>
  <div class="table">
    <Row items={data.slice(0, 4)} />
    <Row items={data.slice(4, 8)} />
    <Row current items={data.slice(8, 12)} />
    <Row items={data.slice(12, 16)} />
    <Row items={data.slice(16, 20)} />
  </div>
</div>

<style>
  .sub-header {
    padding: 10px 20px;
  }

  .table {
    border: 1px solid;
    border-bottom: none;
    border-right: none;
    width: 100%;
  }
  .container {
    display: flex;
    min-width: fit-content;
    overflow: auto;
    font-size: 12px;
    border: 2px solid #8094e9;
    padding: 10px 5px;
    border-radius: 10px;
  }
  .container:hover {
    border: 2px solid #384da9;
  }
  .col {
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
  }
  .colItem {
    border-right: none;
    border-bottom: none;
    display: flex;
    align-items: center;
    height: 100%;
    padding: 20px;
    width: 30px;
    /* margin: 0 auto; */
    justify-content: center;
  }

  :global(svg.clickables):hover {
    cursor: pointer;
  }
</style>
