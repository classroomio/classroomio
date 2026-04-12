<script lang="ts">
  import { untrack } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { Button } from '@cio/ui/base/button';
  import { ROLE } from '@cio/utils/constants';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { orgApi } from '$features/org/api/org.svelte';
  import { DEFAULT_ORG_AUDIENCE_QUERY } from '$features/org/utils/audience-query-utils';
  import { BulkEmailSection, ExistingStudentsSection, TutorSelectSection } from '$features/people/components';
  import type { OrgStudent, Tutor } from '$features/people/utils/types';
  import type { OrgTeamMember } from '$lib/utils/types/org';
  import { programApi } from '../api';

  interface Props {
    programId: string;
  }

  let { programId }: Props = $props();

  let tutors = $state<Tutor[]>([]);
  let selectedIds = $state<string[]>([]);
  let isLoadingStudents = $state(false);
  let activeTab = $state<'tutors' | 'students'>('students');

  const addPeopleParam = $derived(new URLSearchParams(page.url.search).get('add'));
  const isOpen = $derived(addPeopleParam === 'true');
  const selectedTutors = $derived(tutors.filter((tutor) => selectedIds.includes(tutor.id.toString())));
  const availableStudents = $derived.by(() => getAvailableStudents(orgApi.audience, programApi.members));
  const INVITE_MODAL = 'course.navItem.people.invite_modal';

  function getTutors(team: OrgTeamMember[]) {
    const existingTutorIds = new Set(
      programApi.members
        .filter((member) => Number(member.roleId) === ROLE.TUTOR || Number(member.roleId) === ROLE.ADMIN)
        .map((member) => member.profileId)
        .filter((profileId): profileId is string => Boolean(profileId))
    );

    return team
      .filter((teamMember) => teamMember.verified)
      .filter((teamMember) => !existingTutorIds.has(teamMember.profileId))
      .map((teamMember) => ({
        id: teamMember.id,
        text: teamMember.fullname,
        profileId: teamMember.profileId,
        email: teamMember.email
      }));
  }

  function getAvailableStudents(students: OrgStudent[], programMembers: typeof programApi.members) {
    const existingStudentIds = new Set(
      programMembers
        .filter((member) => Number(member.roleId) === ROLE.STUDENT)
        .map((member) => member.profileId)
        .filter((profileId): profileId is string => Boolean(profileId))
    );

    return students.filter((student) => {
      if (!student.profileId) {
        return false;
      }

      return !existingStudentIds.has(student.profileId);
    });
  }

  function closeModal() {
    goto(resolve(page.url.pathname, {}));
  }

  function setTutors(orgId: string | undefined) {
    if (!orgId) {
      return;
    }

    untrack(async () => {
      await orgApi.getOrgTeam();
      if (orgApi.error) {
        console.error('Error fetching teams', orgApi.error);
        return;
      }

      tutors = getTutors(orgApi.teamMembers);
    });
  }

  function loadStudents(orgId: string | undefined) {
    if (!orgId) {
      return;
    }

    untrack(async () => {
      isLoadingStudents = true;

      try {
        await orgApi.getOrgAudience(orgId, DEFAULT_ORG_AUDIENCE_QUERY, { abortPrevious: true });
      } finally {
        isLoadingStudents = false;
      }
    });
  }

  async function handleStudentSearch(value: string) {
    const orgId = $currentOrg.id;
    if (!orgId) {
      return;
    }

    isLoadingStudents = true;

    try {
      await orgApi.getOrgAudience(
        orgId,
        {
          ...DEFAULT_ORG_AUDIENCE_QUERY,
          search: value.trim() || undefined
        },
        { abortPrevious: true }
      );
    } finally {
      isLoadingStudents = false;
    }
  }

  async function addTutors() {
    if (!selectedTutors.length) {
      closeModal();
      return;
    }

    programApi.success = false;

    await programApi.addMembers(programId, {
      members: selectedTutors.map((tutor) => ({
        profileId: tutor.profileId,
        roleId: ROLE.TUTOR,
        email: tutor.email,
        name: tutor.text
      }))
    });

    if (programApi.success) {
      closeModal();
    }
  }

  async function assignExistingStudents(profileIds: string[], sendEmail: boolean) {
    const result = await orgApi.assignAudienceToCourses({
      profileIds,
      programIds: [programId],
      sendEmail
    });

    if (!result) {
      return;
    }

    await programApi.listMembers(programId, true);
  }

  async function inviteNewStudents(recipientCsv: string, sendEmail: boolean) {
    const result = await orgApi.importAudienceMembers({
      recipientCsv,
      programIds: [programId],
      sendEmail
    });

    if (!result) {
      return;
    }

    await programApi.listMembers(programId, true);
  }

  $effect(() => {
    setTutors($currentOrg.id);
  });

  $effect(() => {
    if (!isOpen || !programId) {
      return;
    }

    untrack(() => {
      activeTab = 'students';
      selectedIds = [];
      void loadStudents($currentOrg.id);
    });
  });
</script>

<Dialog.Root
  open={isOpen}
  onOpenChange={(open) => {
    if (!open) closeModal();
  }}
>
  <Dialog.Content class="max-h-[80vh] w-[96vw] max-w-3xl! overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>{$t('programs.people.invite_modal_title')}</Dialog.Title>
    </Dialog.Header>

    <UnderlineTabs.Root bind:value={activeTab}>
      <UnderlineTabs.List class="flex flex-wrap">
        <UnderlineTabs.Trigger value="tutors">
          {$t(`${INVITE_MODAL}.invite`)}
        </UnderlineTabs.Trigger>
        <UnderlineTabs.Trigger value="students">
          {$t(`${INVITE_MODAL}.invite_students`)}
        </UnderlineTabs.Trigger>
      </UnderlineTabs.List>

      <UnderlineTabs.Content value="tutors">
        <div class="mt-6 space-y-6">
          <TutorSelectSection
            {tutors}
            bind:selectedIds
            isLoading={orgApi.isLoading}
            helperHref={`/org/${$currentOrg.siteName}/settings/teams`}
          />

          <div class="mt-5 flex flex-row-reverse items-center gap-2">
            <Button variant="secondary" type="button" onclick={addTutors} loading={programApi.isLoading}>
              {$t(`${INVITE_MODAL}.finish`)}
            </Button>
          </div>
        </div>
      </UnderlineTabs.Content>

      <UnderlineTabs.Content value="students">
        <div class="mt-6 space-y-6">
          <ExistingStudentsSection
            students={availableStudents}
            isLoading={isLoadingStudents}
            onSearchValueChange={handleStudentSearch}
            onAssign={assignExistingStudents}
          />
          <BulkEmailSection onInvite={inviteNewStudents} />
        </div>
      </UnderlineTabs.Content>
    </UnderlineTabs.Root>
  </Dialog.Content>
</Dialog.Root>
