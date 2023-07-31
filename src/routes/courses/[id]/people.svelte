<script context="module">
  import {
    fetchCourse,
    deleteGroupMember,
    updatedGroupMember,
  } from '../../../utils/services/courses';

  export async function preload({ params }) {
    return { courseId: params.id };
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import copy from 'copy-to-clipboard';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';
  import Edit16 from 'carbon-icons-svelte/lib/Edit16';
  import Copy16 from 'carbon-icons-svelte/lib/Copy16';
  import Delete24 from 'carbon-icons-svelte/lib/Delete24';
  import Avatar from '../../../components/Avatar/index.svelte';
  import PageNav from '../../../components/PageNav/index.svelte';
  import PrimaryButton from '../../../components/PrimaryButton/index.svelte';
  import TextField from '../../../components/Form/TextField.svelte';
  import Select from '../../../components/Form/Select.svelte';
  import IconButton from '../../../components/IconButton/index.svelte';
  import PageBody from '../../../components/PageBody/index.svelte';
  import RoleBasedSecurity from '../../../components/RoleBasedSecurity/index.svelte';
  import { setCourse, course, group } from '../../../components/Course/store';
  import InviationModal from '../../../components/Course/components/People/InviationModal.svelte';
  import DeleteConfirmation from '../../../components/Course/components/People/DeleteConfirmation.svelte';
  import {
    invitationModal,
    deleteMemberModal,
  } from '../../../components/Course/components/People/store';
  import type {
    Person,
    ProfileRole,
  } from '../../../components/Course/components/People/types';
  import { ROLE_LABEL, ROLES } from '../../../utils/constants/roles';
  import { profile } from '../../../utils/store/user';
  import { snackbarStore } from '../../../components/Snackbar/store';

  export let courseId: string = '';

  let people: Array<Person> = [];
  let borderBottomGrey = 'border-r-0 border-b border-l-0 border-gray-300';
  let member: { id?: string; email?: string; profile?: { email: string } } = {};
  let shouldEditMemberId: string | null = null;
  let filterBy: ProfileRole = ROLES[0];
  let isStudent = false;

  // function setPeople(people: Array<Person>) {
  //   if (!Array.isArray(people)) return;

  //   people = (people || []).sort((a, b) => a.role_id - b.role_id);
  //   console.log(`people changed`, people);
  // }

  async function deletePerson() {
    $group.people = $group.people.filter(
      (person: { id: string }) => person.id !== member.id
    );

    await deleteGroupMember(member.id);
  }

  async function editMemberId(person: Person) {
    await updatedGroupMember(
      { assigned_student_id: person.assigned_student_id },
      { id: person.id }
    );
    shouldEditMemberId = null;
  }

  function sortAndFilterPeople(_people: Array<Person>, filterBy: ProfileRole) {
    people = (_people || [])
      .filter((person) => {
        if (filterBy.value === 'all') return true;

        return person.role_id === filterBy.value;
      })
      .sort((a: Person, b: Person) => a.role_id - b.role_id);
  }

  function handleEditStudentIdMode(personId: string) {
    shouldEditMemberId = personId;
  }

  function copyToClipboard(studentAssignedId: string | null) {
    $snackbarStore.open = true;
    $snackbarStore.message = `Copied to clipboard`;

    if (studentAssignedId) {
      copy(studentAssignedId);
    }
  }

  onMount(async () => {
    if ($course.id) return;
    const { data } = await fetchCourse(courseId);
    setCourse(data);
  });

  $: sortAndFilterPeople($group.people, filterBy);
</script>

<InviationModal />
<DeleteConfirmation
  email={member.email || (member.profile && member.profile.email)}
  {deletePerson}
/>

<CourseContainer bind:isStudent>
  <PageNav title="People" disableSticky={true}>
    <slot:fragment slot="widget">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <PrimaryButton
          className="mr-2"
          label="Add"
          onClick={() => ($invitationModal.open = true)}
        />
      </RoleBasedSecurity>
    </slot:fragment>
  </PageNav>
  <PageBody className="">
    <div class="mb-3">
      <Select
        label="Filter by"
        bind:value={filterBy}
        options={ROLES}
        className="flex items-center dark:text-black"
      />
    </div>

    <div class="table rounded-md border border-gray-300 w-full">
      <div
        class="flex items-center font-bold border-t-0 {borderBottomGrey} p-3"
      >
        <span class="dark:text-white w-1/4 text-center">ID</span>
        <!-- <span class="flex-grow" /> -->
        <p class="dark:text-white text-lg w-2/4">Name</p>
        <p class="dark:text-white text-lg w-1/4">Role</p>
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <p class="dark:text-white hidden lg:block text-lg w-20" />
        </RoleBasedSecurity>
      </div>

      {#each people as person}
        <div class="flex relative items-center p-3 {borderBottomGrey}">
          {#if shouldEditMemberId === person.id}
            <TextField
              bind:value={person.assigned_student_id}
              type="string"
              placeholder="Unique ID"
              className="w-1/4"
              onChange={() => editMemberId(person)}
            />
          {:else}
            <div class="student-id flex items-center justify-between relative">
              <p class="dark:text-white w-11/12">
                {person.assigned_student_id || '-'}
              </p>
              {#if !isStudent}
                <div class="absolute edit-btn">
                  <IconButton
                    onClick={() => handleEditStudentIdMode(person.id)}
                  >
                    <Edit16 class="carbon-icon active" />
                  </IconButton>
                  <IconButton
                    onClick={() => copyToClipboard(person.assigned_student_id)}
                  >
                    <Copy16 class="carbon-icon active" />
                  </IconButton>
                </div>
              {/if}
            </div>
          {/if}
          <!-- <span class="flex-grow" /> -->
          {#if person.profile}
            <div class="w-2/4 mx-2 flex items-center">
              <Avatar
                src={person.profile.avatar_url}
                name={person.profile.fullname}
              />
              <div class="ml-2 break-all">
                <p class="dark:text-white text-lg">{person.profile.fullname}</p>
                {#if !isStudent}
                  <a
                    href="mailto:{person.profile.email}"
                    class="text-md text-blue-600"
                  >
                    {person.profile.email}
                  </a>
                {/if}
              </div>
            </div>
          {:else}
            <div class="break-all w-2/4 mx-2">
              <p
                class="bg-yellow-500 pending text-sm text-center rounded-xl text-white"
              >
                Pending Invite
              </p>
              <a href="mailto:{person.email}" class="text-md text-blue-600">
                {person.email}
              </a>
            </div>
          {/if}

          <p class="dark:text-white text-lg w-1/4">
            {ROLE_LABEL[person.role_id]}
          </p>

          <RoleBasedSecurity allowedRoles={[1, 2]}>
            <div class="hidden lg:block w-20">
              {#if person.profile_id !== $profile.id}
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
          </RoleBasedSecurity>
        </div>
      {/each}
    </div>
  </PageBody>
</CourseContainer>

<style>
  .pending {
    width: fit-content;
    padding: 1px 15px;
  }

  .student-id {
    width: 155px;
  }

  .student-id p {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .edit-btn {
    display: none;
  }
  .student-id:hover .edit-btn {
    display: flex;
    bottom: 20px;
    right: 0px;
  }
</style>
