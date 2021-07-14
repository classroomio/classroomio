<script context="module">
  export async function preload({ params }) {
    const { id: courseId, lessonParams = [] } = params;
    const [lessonId, exerciseRouteName, exerciseId] = lessonParams;

    const res = await this.fetch(
      `api/course?id=${courseId}&lessonId=${lessonId}&exerciseId=${exerciseId}`
    );
    const data = await res.json();

    if (res.status === 200) {
      return {
        courseData: data,
        lessonId,
        isMaterialsTabActive: !exerciseRouteName,
        exerciseId,
      };
    } else {
      this.error(res.status, data.message);
    }
  }
</script>

<script>
  import { stores } from '@sapper/app';
  import CourseContainer from '../../../../../components/CourseContainer/index.svelte';

  import PrimaryButton from '../../../../../components/PrimaryButton/index.svelte';
  import PageNav from '../../../../../components/PageNav/index.svelte';
  import PageBody from '../../../../../components/PageBody/index.svelte';
  import Materials from '../../../../../components/Course/components/Lesson/Materials/index.svelte';
  import Exercises from '../../../../../components/Course/components/Lesson/Exercises/index.svelte';
  import MODES from '../../../../../utils/constants/mode.js';

  export let courseData;
  export let lessonId;
  export let isMaterialsTabActive;
  export let exerciseId;

  let path;
  let mode = MODES.view;

  const { page } = stores();

  $: path = $page.path.replace(/\/exercises[\/ 0-9]*/, '');
</script>

<CourseContainer {courseData} {path}>
  <PageNav
    navItems={[
      {
        label: 'Materials',
        isActive: isMaterialsTabActive,
        href: path,
      },
      {
        label: 'Exercises',
        isActive: !isMaterialsTabActive,
        href: `${path}/exercises`,
      },
    ]}
  >
    <svelte:fragment slot="widget">
      <div class="flex items-center">
        <PrimaryButton
          className="mr-2"
          label={mode === MODES.edit ? 'Save' : 'Edit'}
          onClick={() => (mode = mode === MODES.edit ? MODES.view : MODES.edit)}
        />
      </div>
    </svelte:fragment>
  </PageNav>

  <PageBody>
    {#if !isMaterialsTabActive}
      <Exercises {exerciseId} path={`${path}/exercises`} />
    {:else}
      <Materials {lessonId} {mode} />
    {/if}
  </PageBody>
</CourseContainer>
