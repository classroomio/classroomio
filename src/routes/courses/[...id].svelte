<script context="module">
  export async function preload({ params }) {
    let [slug, lecture, lectureId] = params.id;

    return { slug, lecture, lectureId };
  }
</script>

<script>
  import { stores } from "@sapper/app";
  import PageNav from "../../components/PageNav/index.svelte";
  import Course from "../../components/Courses/components/Course.svelte";
  import CourseNav from "../../components/Courses/components/CourseNav.svelte";

  export let slug;
  export let lecture;
  export let lectureId;
  console.log("slug", slug);
  console.log("lecture", lecture);
  console.log("lectureId", lectureId);

  const { page } = stores();
  const path = $page.path;
  let tab = "";

  $: tab = $page.query.tab || "lectures";
</script>

<svelte:head>
  <title>QA Automation</title>
</svelte:head>

<div class="root">
  <CourseNav />
  <div>
    <PageNav
      navItems={[
        {
          label: "README.md",
          isActive: tab === "lectures",
          href: `${path}?tab=lectures`,
        },
        {
          label: "Class work",
          isActive: tab === "classwork",
          href: `${path}?tab=classwork`,
        },
        {
          label: "Hometasks",
          isActive: tab === "hometasks",
          href: `${path}?tab=hometasks`,
        },
      ]}
    />
    <Course />
  </div>
</div>

<style>
  .root {
    /* min-width: 600px;
    margin: 0 auto; */
    flex-grow: 1;
    display: flex;
    border-right: 1px solid var(--border-color);
  }
</style>
