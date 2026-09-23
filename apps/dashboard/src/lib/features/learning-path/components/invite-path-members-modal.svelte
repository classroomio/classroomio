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
  import { currentOrg, isStudentLimitReached } from '$lib/utils/store/org';
  import { orgApi } from '$features/org/api/org.svelte';
  import { DEFAULT_ORG_AUDIENCE_QUERY } from '$features/org/utils/audience-query-utils';
  import {
    BulkEmailSection,
    ExistingStudentsSection,
    InviteLinkSection,
    TutorSelectSection
  } from '$features/people/components';
  import { UpgradeBanner } from '$features/ui';
  import type { OrgStudent, Tutor } from '$features/people/utils/types';
  import { buildResourceInviteLink } from '$features/people/utils/invite-link-utils';
  import type { OrgTeamMember } from '$lib/utils/types/org';
  import { pathInviteLinkApi, pathMembersApi } from '../api';

  interface Props {
    pathId: string;
    /** Called after the path roster changes so the caller can refresh its list. */
    onMembersChanged?: () => void;
  }

  let { pathId, onMembersChanged }: Props = $props();

  let selectedIds = $state<string[]>([]);
  let isLoadingStudents = $state(false);
  let activeTab = $state<'tutors' | 'students' | 'link'>('students');

  const addPeopleParam = $derived(new URLSearchParams(page.url.search).get('add'));
  const isOpen = $derived(addPeopleParam === 'true');
  const tutors = $derived.by(() => getTutors(orgApi.teamMembers, pathMembersApi.members));
  const selectedTutors = $derived(tutors.filter((tutor) => selectedIds.includes(tutor.id.toString())));
  const availableStudents = $derived.by(() => getAvailableStudents(orgApi.audience, pathMembersApi.members));
  const inviteLink = $derived(buildResourceInviteLink(pathInviteLinkApi.inviteLink?.token, $currentOrg));
  const INVITE_MODAL = 'course.navItem.people.invite_modal';

  function getTutors(team: OrgTeamMember[], members: typeof pathMembersApi.members): Tutor[] {
    const existingTutorProfileIds = new Set(
      members
        .filter((member) => Number(member.roleId) === ROLE.TUTOR || Number(member.roleId) === ROLE.ADMIN)
        .map((member) => member.profileId)
        .filter((profileId): profileId is string => Boolean(profileId))
    );
    const existingTutorEmails = new Set(
      members
        .filter((member) => Number(member.roleId) === ROLE.TUTOR || Number(member.roleId) === ROLE.ADMIN)
        .map((member) => (member.profileEmail ?? member.email)?.toLowerCase())
        .filter((email): email is string => Boolean(email))
    );

    return team
      .filter((teamMember) => teamMember.verified)
      .filter((teamMember) => {
        if (teamMember.profileId && existingTutorProfileIds.has(teamMember.profileId)) {
          return false;
        }

        if (teamMember.email && existingTutorEmails.has(teamMember.email.toLowerCase())) {
          return false;
        }

        return true;
      })
      .map((teamMember) => ({
        id: teamMember.id,
        text: teamMember.fullname,
        profileId: teamMember.profileId,
        email: teamMember.email
      }));
  }

  function getAvailableStudents(students: OrgStudent[], pathMembers: typeof pathMembersApi.members) {
    const existingStudentIds = new Set(
      pathMembers
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

  function loadTeam(orgId: string | undefined) {
    if (!orgId) {
      return;
    }

    untrack(async () => {
      await orgApi.getOrgTeam();
      if (orgApi.error) {
        console.error('Error fetching teams', orgApi.error);
      }
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

    const members = selectedTutors.map((tutor) => ({
      profileId: tutor.profileId,
      email: tutor.email,
      roleId: ROLE.TUTOR
    }));

    if (members.length === 0) {
      closeModal();
      return;
    }

    const result = await pathMembersApi.addMembers(pathId, members, {
      successKey:
        selectedTutors.length === 1 ? 'learningPath.snackbar.tutor_added' : 'learningPath.snackbar.tutors_added'
    });

    if (result?.success) {
      selectedIds = [];
      onMembersChanged?.();
      closeModal();
    }
  }

  async function assignExistingStudents(profileIds: string[]) {
    const result = await pathMembersApi.addMembers(
      pathId,
      profileIds.map((profileId) => ({ profileId, roleId: ROLE.STUDENT }))
    );

    if (result?.success) {
      onMembersChanged?.();
      closeModal();
    }
  }

  async function inviteNewStudents(recipientCsv: string, sendEmail: boolean) {
    if (!recipientCsv.trim()) {
      return;
    }

    const response = await orgApi.importAudienceMembers({
      recipientCsv,
      pathIds: [pathId],
      sendEmail
    });

    if (!response) {
      return;
    }

    onMembersChanged?.();
  }

  async function generateInviteLink() {
    await pathInviteLinkApi.generateInviteLink(pathId);
  }

  async function toggleInviteLink(isRevoked: boolean) {
    await pathInviteLinkApi.toggleInviteLink(pathId, isRevoked);
  }

  $effect(() => {
    loadTeam($currentOrg.id);
  });

  $effect(() => {
    if (!isOpen || !pathId) {
      return;
    }

    untrack(() => {
      activeTab = 'students';
      selectedIds = [];
      void loadTeam($currentOrg.id);
      void loadStudents($currentOrg.id);
      void pathInviteLinkApi.getInviteLink(pathId);
    });
  });

  // Drop selections that are no longer offered (e.g. a tutor added in another
  // tab or session) so a stale id can never be resubmitted.
  $effect(() => {
    const availableIds = new Set(tutors.map((tutor) => tutor.id.toString()));

    if (selectedIds.some((id) => !availableIds.has(id))) {
      selectedIds = selectedIds.filter((id) => availableIds.has(id));
    }
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
      <Dialog.Title>{$t('learningPath.people.invite.title')}</Dialog.Title>
    </Dialog.Header>

    <UnderlineTabs.Root bind:value={activeTab}>
      <UnderlineTabs.List class="flex flex-wrap">
        <UnderlineTabs.Trigger value="tutors">
          {$t(`${INVITE_MODAL}.invite`)}
        </UnderlineTabs.Trigger>
        <UnderlineTabs.Trigger value="students">
          {$t(`${INVITE_MODAL}.invite_students`)}
        </UnderlineTabs.Trigger>
        <UnderlineTabs.Trigger value="link">
          {$t('invite_link.tab_label')}
        </UnderlineTabs.Trigger>
      </UnderlineTabs.List>

      <UnderlineTabs.Content value="tutors">
        <div class="space-y-3">
          <TutorSelectSection
            {tutors}
            bind:selectedIds
            isLoading={orgApi.isLoading}
            helperHref={`/org/${$currentOrg.siteName}/settings/teams`}
          />

          <div class="mt-5 flex flex-row-reverse items-center gap-2">
            <Button variant="secondary" type="button" onclick={addTutors} loading={pathMembersApi.isLoading}>
              {$t(`${INVITE_MODAL}.finish`)}
            </Button>
          </div>
        </div>
      </UnderlineTabs.Content>

      <UnderlineTabs.Content value="students">
        <div class="space-y-6">
          <ExistingStudentsSection
            students={availableStudents}
            isLoading={isLoadingStudents}
            onSearchValueChange={handleStudentSearch}
            onAssign={assignExistingStudents}
          />
          {#if $isStudentLimitReached}
            <UpgradeBanner removeParams={['add']}>{$t(`${INVITE_MODAL}.student_limit_reached`)}</UpgradeBanner>
          {/if}
          <BulkEmailSection
            onInvite={inviteNewStudents}
            disabled={$isStudentLimitReached}
            titleKey="learningPath.people.invite.bulk_title"
            descriptionKey="learningPath.people.invite.bulk_description"
            submitKey="learningPath.people.invite.bulk_submit"
          />
        </div>
      </UnderlineTabs.Content>

      <UnderlineTabs.Content value="link">
        <div class="space-y-6">
          <InviteLinkSection
            link={inviteLink}
            isRevoked={pathInviteLinkApi.inviteLink?.isRevoked ?? false}
            isLoading={pathInviteLinkApi.isLoading}
            joinCount={pathInviteLinkApi.inviteLink?.joinCount}
            descriptionKey="invite_link.learning_path_description"
            onGenerate={generateInviteLink}
            onToggle={toggleInviteLink}
          />

          {#if $isStudentLimitReached}
            <UpgradeBanner removeParams={['add']}>{$t(`${INVITE_MODAL}.student_limit_reached`)}</UpgradeBanner>
          {/if}
        </div>
      </UnderlineTabs.Content>
    </UnderlineTabs.Root>
  </Dialog.Content>
</Dialog.Root>
