<script context="module">
  import { fetchCourse } from '../../../utils/services/courses';

  export async function preload({ params }) {
    return { courseId: params.id };
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';
  import PageNav from '../../../components/PageNav/index.svelte';
  import PrimaryButton from '../../../components/PrimaryButton/index.svelte';
  import PageBody from '../../../components/PageBody/index.svelte';
  import { setCourseData, course } from '../../../components/Course/store';
  import InviationModal from '../../../components/Course/components/People/InviationModal.svelte';
  import { invitationModal } from '../../../components/Course/components/People/store';
  import type { Person } from '../../../components/Course/components/People/types';
  import { ROLE_LABEL } from '../../../utils/constants/roles';

  export let courseId: string = '';

  let people: Array<Person> = [];
  let borderBottomGrey = 'border-r-0 border-b border-l-0 border-gray-300';

  function setPeople(group) {
    if (!group) return;
    const { students, tutors } = group;
    people = [...students, ...tutors].sort((a, b) => a.role_id - b.role_id);
    console.log(`group changed`, group);
  }

  onMount(async () => {
    if ($course.id) return;
    const { data } = await fetchCourse(courseId);
    setCourseData(data);
  });

  $: setPeople($course.group);
</script>

<InviationModal />

<CourseContainer>
  <PageNav title="People" disableSticky={true}>
    <slot:fragment slot="widget">
      <PrimaryButton
        className="mr-2"
        label="Add"
        onClick={() => ($invitationModal.open = true)}
      />
    </slot:fragment>
  </PageNav>
  <PageBody className="">
    <div class="table rounded-md border border-gray-300 w-11/12 m-auto">
      <div
        class="flex items-center justify-evenly font-bold border-t-0 {borderBottomGrey} p-3"
      >
        <span class="mr-2">No</span>
        <!-- <span class="flex-grow" /> -->
        <p class="text-lg w-1/4">Name</p>
        <p class="text-lg w-1/4">Email</p>
        <p class="text-lg w-1/4 ">Role</p>
      </div>

      {#each people as person, index}
        <div
          class="flex items-center justify-evenly p-3 cursor-pointer {borderBottomGrey} hover:bg-gray-100"
        >
          <span class="mr-2">{index + 1}</span>
          <!-- <span class="flex-grow" /> -->
          {#if person.profile}
            <p class="text-lg w-1/4 break-all">{person.profile.fullname}</p>
          {:else}
            <p
              class="bg-yellow-500 w-1/4 text-sm text-center rounded-xl text-white"
            >
              Pending confirmation
            </p>
          {/if}
          <p class="text-lg w-1/4 break-all">{person.email}</p>
          <p class="text-lg w-1/4 ">{ROLE_LABEL[person.role_id]}</p>
        </div>
      {/each}
    </div>
  </PageBody>
</CourseContainer>
