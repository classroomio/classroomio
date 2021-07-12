<script context="module">
  export async function preload({ params }) {
    let [lessonId, exerciseRouteName, exerciseId] = params.id;
    return { lessonId, exerciseRouteName, exerciseId };
  }
</script>

<script>
  import { stores } from '@sapper/app';
  import CourseContainer from '../../../../../components/CourseContainer/index.svelte';

  import PageNav from '../../../../../components/PageNav/index.svelte';
  import PageBody from '../../../../../components/PageBody/index.svelte';
  import Readme from '../../../../../components/Course/components/Lesson/Readme/index.svelte';
  import Exercises from '../../../../../components/Course/components/Lesson/Exercises/index.svelte';

  export let lessonId;
  export let exerciseRouteName;
  export let exerciseId;

  let path;

  const { page } = stores();

  function getCourseId() {
    return $page.path.match(/\w+\/(\d)\//)[1];
  }

  $: path = $page.path.replace(/\/exercises[\/ 0-9]*/, '');
</script>

<CourseContainer title="ReactJS" courseId={getCourseId()}>
  <PageNav
    navItems={[
      {
        label: 'README.md',
        isActive: !exerciseRouteName,
        href: path,
      },
      {
        label: 'Exercises',
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
