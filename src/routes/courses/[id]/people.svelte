<script context="module">
  import { fetchCourse } from '../../../utils/services/courses';

  export async function preload({ params }, session) {
    if (process.browser) {
      return {};
    }

    const {
      data,
      // error
    } = await fetchCourse(params.id, session);

    return { courseData: data };
  }
</script>

<script>
  import { onMount } from 'svelte';
  import { stores } from '@sapper/app';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';
  import PageNav from '../../../components/PageNav/index.svelte';
  import UserCard from '../../../components/UserCard/index.svelte';
  import { setCourseData } from '../../../components/Course/store';

  export let courseData = {};

  const { page } = stores();

  const teachers = [];
  const students = [...teachers, ...teachers, ...teachers];

  onMount(() => {
    setCourseData(courseData);
  });
</script>

<CourseContainer>
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
