<script context="module">
  import {
    fetchCourse,
    deleteGroupMember,
  } from '../../../utils/services/courses';

  export async function preload({ params }) {
    return { courseId: params.id };
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';
  import Delete24 from 'carbon-icons-svelte/lib/Delete24';
  import PageNav from '../../../components/PageNav/index.svelte';
  import PrimaryButton from '../../../components/PrimaryButton/index.svelte';
  import IconButton from '../../../components/IconButton/index.svelte';
  import PageBody from '../../../components/PageBody/index.svelte';
  import {
    setCourseData,
    course,
    group,
  } from '../../../components/Course/store';
  import InviationModal from '../../../components/Course/components/People/InviationModal.svelte';
  import DeleteConfirmation from '../../../components/Course/components/People/DeleteConfirmation.svelte';
  import {
    invitationModal,
    deleteMemberModal,
  } from '../../../components/Course/components/People/store';
  import type { Person } from '../../../components/Course/components/People/types';
  import { ROLE, ROLE_LABEL } from '../../../utils/constants/roles';
  import { profile } from '../../../utils/store/user';

  export let courseId: string = '';

  let people: Array<Person> = [];
  let borderBottomGrey = 'border-r-0 border-b border-l-0 border-gray-300';
  let member: { id?: string; email?: string; profile?: { email: string } } = {};

  // function setPeople(people: Array<Person>) {
  //   if (!Array.isArray(people)) return;

  //   people = (people || []).sort((a, b) => a.role_id - b.role_id);
  //   console.log(`people changed`, people);
  // }

  async function deletePerson() {
    console.log(`member`, member);
    console.log(`$group.people`, $group.people);
    $group.people = $group.people.filter(
      (person: { id: string }) => person.id !== member.id
    );

    await deleteGroupMember(member.id);
  }

  onMount(async () => {
    if ($course.id) return;
    const { data } = await fetchCourse(courseId);
    setCourseData(data);
  });

  $: people = ($group.people || []).sort((a, b) => a.role_id - b.role_id);
</script>

<InviationModal />
<DeleteConfirmation
  email={member.email || (member.profile && member.profile.email)}
  {deletePerson}
/>

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
        <p class="text-lg text-center w-1/4">Name</p>
        <p class="text-lg text-center w-1/4">Email</p>
        <p class="text-lg text-center w-1/4 ">Role</p>
        <p class="text-lg w-20 text-center" />
      </div>

      {#each people as person, index}
        <div
          class="flex text-center relative items-center justify-evenly p-3 cursor-pointer {borderBottomGrey} hover:bg-gray-100"
        >
          <span class="mr-2">{index + 1}</span>
          <!-- <span class="flex-grow" /> -->
          {#if person.profile}
            <p class="text-lg w-1/4 break-all">{person.profile.fullname}</p>
            <a
              href="mailto:{person.profile.email}"
              class="text-md w-1/4 mx-2 text-blue-600"
            >
              {person.profile.email}
            </a>
          {:else}
            <p
              class="bg-yellow-500 w-1/4 text-sm text-center rounded-xl text-white"
            >
              Pending Invite
            </p>
            <a
              href="mailto:{person.email}"
              class="text-md w-1/4 mx-2 text-blue-600"
            >
              {person.email}
            </a>
          {/if}
          <p class="text-lg w-1/4 ">{ROLE_LABEL[person.role_id]}</p>

          <div class="w-20">
            {#if person.profile && person.profile.id !== $profile.id}
              <IconButton
                onClick={() => {
                  member = person;
                  $deleteMemberModal.open = true;
                }}
              >
                <Delete24 class="carbon-icon" />
              </IconButton>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </PageBody>
</CourseContainer>
