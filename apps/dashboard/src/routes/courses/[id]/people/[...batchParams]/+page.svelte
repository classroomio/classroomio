<script lang="ts">
  // import copy from 'copy-to-clipboard';
  import {
    CopyButton,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow
  } from 'carbon-components-svelte';
  import Settings from 'carbon-icons-svelte/lib/Settings.svelte';
  import ArrowLeft from 'carbon-icons-svelte/lib/ArrowLeft.svelte';

  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { profile } from '$lib/utils/store/user';
  import { group } from '$lib/components/Course/store';
  import type { GroupPerson } from '$lib/utils/types';
  import { course } from '$lib/components/Course/store';
  import { t } from '$lib/utils/functions/translations';
  import {
    batchSettingsModal,
    deleteMemberModal
  } from '$lib/components/Course/components/People/store';
  import { courseBatch } from '$lib/components/Course/store';
  import { ROLE_LABEL, ROLES } from '$lib/utils/constants/roles';
  import { deleteGroupMember, updatedGroupMember } from '$lib/utils/services/courses';
  import type { Person, ProfileRole } from '$lib/components/Course/components/People/types';

  import TextChip from '$lib/components/Chip/Text.svelte';
  import Select from '$lib/components/Form/Select.svelte';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import ComingSoon from '$lib/components/ComingSoon/index.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import TrashCanIcon from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import InvitationModal from '$lib/components/Course/components/People/InvitationModal.svelte';
  import BatchSettingsModal from '$lib/components/Course/components/People/BatchSettingsModal.svelte';
  import DeleteConfirmation from '$lib/components/Course/components/People/DeleteConfirmation.svelte';

  // import { snackbar } from '$lib/components/Snackbar/store';
  import Avatar from '$lib/components/Avatar/index.svelte';

  export let data;

  let people: Array<Person> = [];
  let member: { id?: string; email?: string; profile?: { email: string } } = {};
  let shouldEditMemberId: string | null = null;
  let filterBy: ProfileRole = ROLES[0];
  let searchValue = '';

  const batch = $courseBatch.find((item) => item.id === data.batchId);

  // function for the searchbar
  function filterPeople(_query, people) {
    const query = _query.toLowerCase();
    return people.filter((person) => {
      const { profile, email } = person;
      return profile?.fullname?.toLowerCase()?.includes(query) || email?.includes(query);
    });
  }

  async function deletePerson() {
    $group.people = $group.people.filter((person: { id: string }) => person.id !== member.id);
    $group.tutors = $group.tutors.filter((person: GroupPerson) => person.memberId !== member.id);

    await deleteGroupMember(member.id);
  }

  async function editMemberId(person: Person) {
    await updatedGroupMember(
      { assigned_student_id: person.assigned_student_id },
      { id: person.id }
    );
    shouldEditMemberId = null;
  }

  function getEmail(person) {
    const { profile, email } = person;

    return profile ? profile.email : email;
  }

  function obscureEmail(email) {
    const [username, domain] = email.split('@');
    const obscuredUsername =
      username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);

    return `${obscuredUsername}@${domain}`;
  }

  const handleClick = () => {
    const url = $page.url.href + '?add=true';
    goto(url);
  };

  const openBatchSettings = () => {
    const url = $page.url.href + '?batch-settings=true';
    goto(url);
  };

  const goBackToBatches = () => {
    const url = $page.url.toString();
    const splitURL = url.split('/');
    const batchURL = splitURL.slice(0, splitURL.length - 1).join('/');
    return goto(batchURL);
  };
</script>

<InvitationModal {batch} />
<BatchSettingsModal courseId={$course.id} data={batch} />

<DeleteConfirmation
  email={member.email || (member.profile && member.profile.email)}
  {deletePerson}
/>

<CourseContainer bind:courseId={data.courseId}>
  <div class="flex items-center justify-between w-full py-3 px-7 border-b border-gray-300">
    <button on:click={() => goBackToBatches()} class="flex items-center cursor-pointer gap-x-2">
      <ArrowLeft size={24} />
      <p class="text-xl font-medium">{batch?.name}</p>
    </button>
    <div class="flex items-center gap-x-4">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <PrimaryButton
          className="px-9"
          label={$t('course.navItem.people.add')}
          onClick={handleClick}
        />
      </RoleBasedSecurity>

      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <button on:click={() => ($batchSettingsModal.open = true)}>
          <Settings size={32} />
        </button>
      </RoleBasedSecurity>
    </div>
  </div>

  <PageBody width="w-full max-w-6xl md:w-11/12">
    <section class="mt-7 mx-2 md:mx-9">
      <StructuredList class="m-0">
        <StructuredListHead
          class="bg-slate-100 dark:bg-neutral-800 dark:border-2 dark:border-neutral-800"
        >
          <StructuredListRow head class="mx-7">
            <StructuredListCell head class="text-primary-700 py-5 pl-10 dark:text-white"
              >{$t('course.navItem.people.name')}</StructuredListCell
            >
            <StructuredListCell head class="text-primary-700 py-5 dark:text-white"
              >{$t('course.navItem.people.role')}</StructuredListCell
            >
            <StructuredListCell head class="text-primary-700 py-5 dark:text-white"
              >{$t('course.navItem.people.action')}</StructuredListCell
            >
            <RoleBasedSecurity allowedRoles={[1, 2]}>
              <p class="dark:text-white hidden lg:block text-lg w-20" />
            </RoleBasedSecurity>
          </StructuredListRow>
        </StructuredListHead>

        {#if batch && batch.groupmember}
          {#each batch.groupmember as person}
            <StructuredListBody>
              <StructuredListRow class="relative">
                <!-- first column -->
                <StructuredListCell class="w-4/6 md:w-3/6 py-2">
                  {#if person.profile}
                    <div class="flex items-start lg:items-center">
                      <!-- <Avatar
                      src={person.profile.avatar_url}
                      name={person.profile.fullname}
                      width="w-8"
                      height="h-8"
                      className="mr-3"
                    /> -->
                      <div class="flex flex-col lg:flex-row items-start lg:items-center">
                        <div class="mr-2">
                          <p class="dark:text-white text-base font-normal">
                            {person.profile.fullname}
                          </p>
                          <!-- <p class="text-xs text-primary-600 line-clamp-1">
                          {obscureEmail(getEmail(person))}
                        </p> -->
                        </div>
                        <div class="flex items-center">
                          <RoleBasedSecurity allowedRoles={[1, 2]}>
                            <CopyButton
                              text={getEmail(person)}
                              feedback="Copied Email to clipboard"
                            />
                          </RoleBasedSecurity>
                          {#if person.profile_id == $profile.id}
                            <ComingSoon label={$t('course.navItem.people.you')} />
                          {/if}
                        </div>
                      </div>
                    </div>
                  {:else}
                    <div class="flex items-start lg:items-center w-2/4">
                      <TextChip
                        value={person.email.substring(0, 2).toUpperCase()}
                        className="bg-primary-200 text-black font-semibold text-xs mr-3"
                        shape="rounded-full"
                      />
                      <a
                        href="mailto:{person.email}"
                        class="text-md text-primary-600 mr-2 dark:text-white"
                      >
                        {person.email}
                      </a>
                      <div class="flex items-center justify-between">
                        <RoleBasedSecurity allowedRoles={[1, 2]}>
                          <CopyButton
                            text={getEmail(person)}
                            feedback={$t('course.navItem.people.feedback')}
                          />
                        </RoleBasedSecurity>

                        <TextChip
                          value={$t('course.navItem.people.pending')}
                          className="text-xs bg-yellow-200 text-yellow-700 h-fit"
                          size="sm"
                        />
                      </div>
                    </div>
                  {/if}
                </StructuredListCell>

                <!-- second column -->
                <StructuredListCell class="w-1/4 px-3">
                  <p class=" dark:text-white font-normal text-center text-base w-1/4">
                    {$t(ROLE_LABEL[person.role_id])}
                  </p>
                </StructuredListCell>

                <!-- third column -->
                <StructuredListCell class="p-0 w-1/4">
                  <RoleBasedSecurity allowedRoles={[1, 2]}>
                    <div class="hidden sm:flex sm:justify-between sm:items-center w-20">
                      {#if person.profile_id !== $profile.id}
                        <IconButton
                          onClick={() => {
                            member = person;
                            $deleteMemberModal.open = true;
                          }}
                        >
                          <TrashCanIcon size={16} class="carbon-icon dark:text-white" />
                        </IconButton>
                      {/if}
                    </div>
                  </RoleBasedSecurity>
                </StructuredListCell>
              </StructuredListRow>
            </StructuredListBody>
          {/each}
        {/if}
      </StructuredList>
      <!-- <Pagination totalItems={10} pageSizes={[10, 15, 20]} /> -->
    </section>
  </PageBody>
</CourseContainer>
