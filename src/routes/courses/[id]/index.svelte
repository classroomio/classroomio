<script context="module">
  export async function preload({ params }) {
    let [courseId, courseNavItem, lessonId] = params.id;
    console.log(`course id`, params);
    return { courseId, courseNavItem, lessonId };
  }
</script>

<script>
  import Overview from '../../../components/Course/index.svelte';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';

  export let courseId;
</script>

<CourseContainer title="ReactJS" {courseId}>
  <Overview />
</CourseContainer>
