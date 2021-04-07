<script>
  import { stores } from "@sapper/app";
  import Row from "./Row.svelte";
  import data from "./data";

  const { page } = stores();
  let tab = "";
  $: tab = $page.query.tab || "mine";
</script>

<div class="root">
  <div class="header flex justify-between mb-2">
    <h4 class="title">Расписание</h4>
    <div class="flex justify-evenly items-center">
      <a
        class="mr-5 text-sm {tab === 'mine' && 'active'}"
        href="/timetable?tab=mine"
      >
        Мои
      </a>
      <a
        class="mr-5 text-sm {tab === 'saved' && 'active'}"
        href="/timetable?tab=saved"
      >
        Сохранение
      </a>
    </div>
  </div>
  <h4>АИ-153</h4>
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
</div>

<style>
  .root {
    margin: 0 auto;
    border-left: 1px solid #eaecef;
    border-right: 1px solid #eaecef;
  }
  .root .header {
    border-bottom: 1px solid #eaecef;
    padding: 15px;
  }

  .active {
    position: relative;
    display: inline-block;
  }

  .active::after {
    position: absolute;
    content: "";
    width: 100%;
    height: 3px;
    background-color: #3182ce;
    display: block;
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
</style>
