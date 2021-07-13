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
  import { stores } from "@sapper/app";
  import CourseContainer from "../../../components/CourseContainer/index.svelte";
  import PageNav from "../../../components/PageNav/index.svelte";
  import UserCard from "../../../components/UserCard/index.svelte";

  export let courseData = {};

  const { page } = stores();

  const teachers = courseData.people;
  const students = [...teachers, ...teachers, ...teachers];
</script>

<CourseContainer {courseData}>
  <PageNav title="People" disableSticky={true} />
  <div class="m-3">
    <h3>
      <a id="teachers" name="teachers" href="{$page.path}#teachers">Teachers</a>
    </h3>
    <div class="flex flex-wrap">
      {#each teachers as teacher}
        <UserCard
          name={teacher.name}
          avatarUrl={teacher.avatar}
          title={teacher.title}
          telegramLink={teacher.telegramLink}
          mailLink={teacher.mailLink}
        />
      {/each}
    </div>
  </div>

  <div class="m-3">
    <h3>
      <a id="students" name="students" href="{$page.path}#students">Students</a>
    </h3>
    <div class="flex flex-wrap">
      {#each students as student}
        <UserCard
          name={student.name}
          avatarUrl={student.avatar}
          title={student.title}
        />
      {/each}
    </div>
  </div>
</CourseContainer>
