<script context="module">
  export async function preload({ params }) {
    const { id: courseId, lessonParams = [] } = params;
    const [lessonId, exerciseRouteName, exerciseId] = lessonParams;

    const res = await this.fetch(`api/course?id=${courseId}`);
    const data = await res.json();

    if (res.status === 200) {
      return { courseData: data, lessonId, exerciseRouteName, exerciseId };
    } else {
      this.error(res.status, data.message);
    }
  }
</script>

<script>
  import { stores } from "@sapper/app";
  import CourseContainer from "../../../../../components/CourseContainer/index.svelte";

  import PageNav from "../../../../../components/PageNav/index.svelte";
  import PageBody from "../../../../../components/PageBody/index.svelte";
  import Readme from "../../../../../components/Course/components/Lesson/Readme/index.svelte";
  import Exercises from "../../../../../components/Course/components/Lesson/Exercises/index.svelte";

  export let courseData;
  export let lessonId;
  export let exerciseRouteName;
  export let exerciseId;

  let path;

  const { page } = stores();

  $: path = $page.path.replace(/\/exercises[\/ 0-9]*/, "");
</script>

<CourseContainer {courseData} {path}>
  <PageNav
    navItems={[
      {
        label: "README.md",
        isActive: !exerciseRouteName,
        href: path,
      },
      {
        label: "Exercises",
        isActive: !!exerciseRouteName,
        href: `${path}/exercises`,
      },
    ]}
  />

  <PageBody>
    {#if !!exerciseRouteName}
      <Exercises {exerciseId} path={`${path}/exercises`} />
    {:else}
      <Readme {lessonId} />
    {/if}
  </PageBody>
</CourseContainer>
