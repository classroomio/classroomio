<script context="module">
  export async function preload({ params }) {
    let [courseId] = params.id;

    const res = await this.fetch(`api/course?id=${courseId}`);
    const data = await res.json();

    if (res.status === 200) {
      return { courseId, courseData: data };
    } else {
      this.error(res.status, data.message);
    }
  }
</script>

<script>
  import Overview from "../../../components/Course/index.svelte";
  import CourseContainer from "../../../components/CourseContainer/index.svelte";

  export let courseData = {};
</script>

<CourseContainer {courseData}>
  <Overview />
</CourseContainer>
