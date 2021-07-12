<script context="module">
  export async function preload({ params }) {
    let [courseId, courseNavItem, lessonId] = params.id;

    return { courseId, courseNavItem, lessonId };
  }
</script>

<script>
  import { stores } from '@sapper/app';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';
  import PageNav from '../../../components/PageNav/index.svelte';
  import UserCard from '../../../components/UserCard/index.svelte';

  const { page } = stores();

  const teachers = [
    {
      name: 'Alexander Pokidin',
      title: 'Senior Software Engineer',
      avatar: 'https://i.pravatar.cc/150?img=1',

      telegramLink: 'https://t.me/seed_of_abraham',
      mailLink: 'mailto:irb.ossystem@gmail.com',
    },
    {
      name: 'Andrey Filatov',
      title: 'Fullstack Software Engineer',
      avatar: 'https://i.pravatar.cc/150?img=2',

      telegramLink: 'https://t.me/seed_of_abraham',
      mailLink: 'mailto:irb.ossystem@gmail.com',
    },
    {
      name: 'Sergey Semko',
      title: 'Senior Software Engineer',
      avatar: 'https://i.pravatar.cc/150?img=3',

      telegramLink: 'https://t.me/seed_of_abraham',
      mailLink: 'mailto:irb.ossystem@gmail.com',
    },
    {
      name: 'Natalia Fedii',
      title: 'Project Manager',
      avatar: 'https://i.pravatar.cc/150?img=4',

      telegramLink: 'https://t.me/seed_of_abraham',
      mailLink: 'mailto:irb.ossystem@gmail.com',
    },
  ];
  const students = [...teachers, ...teachers, ...teachers];
  export let courseId;
</script>

<CourseContainer title="ReactJS" {courseId}>
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
