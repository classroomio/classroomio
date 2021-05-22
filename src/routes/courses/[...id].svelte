<script context="module">
  export async function preload({ params }) {
    let [slug, courseNavItem, lectureId] = params.id;

    return { slug, courseNavItem, lectureId };
  }
</script>

<script>
  import { stores } from "@sapper/app";
  import Lecture from "../../components/Course/components/Lecture/index.svelte";
  import HomeTask from "../../components/Course/components/HomeTask.svelte";
  import Overview from "../../components/Course/index.svelte";
  import People from "../../components/Course/components/People.svelte";
  import Scoreboard from "../../components/Course/components/Scoreboard.svelte";
  import TimeTable from "../../components/Course/components/TimeTable.svelte";
  import CourseNav from "../../components/Course/components/CourseNav.svelte";

  // export let slug;
  export let courseNavItem;
  // export let lectureId;

  const { page } = stores();
  let tab = "";
  let mode = "";

  $: tab = $page.query.tab || "lectures";
  $: mode = $page.query.mode;
</script>

<svelte:head>
  <title>ReactJS</title>
</svelte:head>

<div class="root">
  <CourseNav />
  <div class="rightBar">
    {#if !courseNavItem}
      <Overview />
    {:else if courseNavItem === "score"}
      <Scoreboard />
    {:else if courseNavItem === "timetable"}
      <TimeTable />
    {:else if courseNavItem === "hometasks"}
      <HomeTask />
    {:else if courseNavItem === "lecture"}
      <Lecture path={$page.path} {tab} {mode} />
    {:else if courseNavItem === "people"}
      <People />
    {/if}
  </div>
</div>

<style>
  .root {
    display: flex;
    border-right: 1px solid var(--border-color);
    width: 100%;
  }

  .rightBar {
    width: 80%;
  }
</style>
