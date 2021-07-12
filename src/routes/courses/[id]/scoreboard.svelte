<script context="module">
  export async function preload({ params }) {
    let [courseId, courseNavItem, lessonId] = params.id;

    return { courseId, courseNavItem, lessonId };
  }
</script>

<script>
  import CourseContainer from '../../../components/CourseContainer/index.svelte';
  import PageNav from '../../../components/PageNav/index.svelte';

  export let courseId;
</script>

<CourseContainer title="ReactJS" {courseId}>
  <PageNav title="Scoreboard" />
</CourseContainer>
