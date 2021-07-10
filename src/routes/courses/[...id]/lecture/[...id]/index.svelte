<script context="module">
  export async function preload({ params }) {
    let [courseId, courseNavItem, lectureId] = params.id;

    return { courseId, courseNavItem, lectureId };
  }
</script>

<script>
  import { stores } from "@sapper/app";
  import Lecture from "../../../../../components/Course/components/Lecture/index.svelte";
  import CourseContainer from "../../../../../components/CourseContainer/index.svelte";

  export let courseId;
  export let lectureId;

  const { page } = stores();
  let tab = "";
  let exerciseId = "";

  $: tab = $page.query.tab || "lectures";
  $: exerciseId = $page.query.exerciseId;
</script>

<CourseContainer title="ReactJS" {courseId}>
  <Lecture path={$page.path} {tab} {exerciseId} {lectureId} />
</CourseContainer>
