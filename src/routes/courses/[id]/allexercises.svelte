<script context="module">
  export async function preload({ params }) {
    let [courseId, courseNavItem, lessonId] = params.id;

    return { courseId, courseNavItem, lessonId };
  }
</script>

<script>
  import PageNav from '../../../components/PageNav/index.svelte';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';

  export let courseId;
</script>

<CourseContainer title="ReactJS" {courseId}>
  <PageNav title="All Exercises" />
</CourseContainer>
