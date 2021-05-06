<script>
  import TimeTable from "../components/TimeTable/index.svelte";
  import { stores } from "@sapper/app";

  const { page } = stores();
  let tab = "";

  $: tab = $page.query.tab || "mine";
</script>

<svelte:head>
  <title>Расписание</title>
</svelte:head>

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
  <TimeTable />
  <TimeTable />
  <TimeTable />
</div>

<style>
  .root {
    margin: 0 auto;
    border-left: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
  }
  .root .header {
    border-bottom: 1px solid var(--border-color);
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
    background-color: var(--main-primary-color);
    display: block;
  }
</style>
