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
  import { courseApi } from '$features/course/api';
  import { currentOrg, isStudentLimitReached } from '$lib/utils/store/org';
  import { peopleApi } from '$features/course/api';
  import { orgApi } from '$features/org/api/org.svelte';
  import { DEFAULT_ORG_AUDIENCE_QUERY } from '$features/org/utils/audience-query-utils';
  import { profile } from '$lib/utils/store/user';
  import type { OrgTeamMember } from '$lib/utils/types/org';
  import type { OrgStudent, Tutor } from '$features/people/utils/types';
  import { TutorSelectSection, ExistingStudentsSection, BulkEmailSection } from '$features/people/components';
  import { UpgradeBanner } from '$features/ui';

  let tutors = $state<Tutor[]>([]);
  let selectedIds = $state<string[]>([]);
  let courseId = $derived(courseApi.course?.id ?? '');
  const addPeopleParm = $derived(new URLSearchParams(page.url.search).get('add'));
  const isOpen = $derived(addPeopleParm === 'true');

  const selectedTutors = $derived(tutors.filter((t) => selectedIds.includes(t.id.toString())));
  const INVITE_MODAL = 'course.navItem.people.invite_modal';

  let isLoadingStudents = $state(false);
  let activeTab = $state<'tutors' | 'students'>('students');
  const availableStudents = $derived.by(() => getAvailableStudents(orgApi.audience, courseApi.group.people));

  function getTutors(team: OrgTeamMember[]) {
    const existingTutors = courseApi?.group?.tutors || [];
    return team
      .filter((teamMember) => teamMember.verified)
      .filter((teamMember) => !existingTutors.some((t) => t.id === teamMember.profileId))
      .map((teamMember) => ({
        id: teamMember.id,
        text: teamMember.fullname,
        profileId: teamMember.profileId,
        email: teamMember.email
      }));
  }

  function getAvailableStudents(students: OrgStudent[], courseMembers: typeof courseApi.group.people) {
    const enrolledStudentIds = new Set(
      courseMembers
        .filter((member) => Number(member.roleId) === ROLE.STUDENT)
        .map((member) => member.profileId)
        .filter((profileId): profileId is string => Boolean(profileId))
    );

    return students.filter((student) => {
      if (!student.profileId) {
        return false;
      }
      return !enrolledStudentIds.has(student.profileId);
    });
  }

  function setTutors(orgId: string | undefined) {
    if (!orgId) return;
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
    if (!orgId) return;

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

  async function assignExistingStudents(profileIds: string[], sendEmail: boolean) {
    const result = await orgApi.assignAudienceToCourses({
      profileIds,
      courseIds: [courseId],
      sendEmail
    });

    if (!result) {
      return;
    }

    await courseApi.refreshCourse(courseId, $profile.id);
  }

  async function inviteNewStudents(recipientCsv: string, sendEmail: boolean) {
    const response = await orgApi.importAudienceMembers({
      recipientCsv,
      courseIds: [courseId],
      sendEmail
    });

    if (!response) {
      return;
    }

    await courseApi.refreshCourse(courseId, $profile.id);
  }

  async function onSubmit() {
    if (!selectedTutors.length) {
      goto(resolve(page.url.pathname, {}));
      return;
    }
    const members = selectedTutors.map((tutor) => ({
      profileId: tutor.profileId,
      roleId: ROLE.TUTOR,
      email: tutor.email,
      name: tutor.text
    }));
    await peopleApi.add(courseId, members);
    if (peopleApi.success) {
      goto(resolve(page.url.pathname, {}));
    }
  }

  function closeModal() {
    goto(resolve(page.url.pathname, {}));
  }

  $effect(() => {
    setTutors($currentOrg.id);
  });

  $effect(() => {
    if (!isOpen || !courseId) return;
    untrack(() => {
      activeTab = 'students';
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
      <Dialog.Title>{$t('course.navItem.people.invite_modal.title')}</Dialog.Title>
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
        <div class="space-y-3">
          <TutorSelectSection
            {tutors}
            bind:selectedIds
            isLoading={orgApi.isLoading}
            helperHref={`/org/${$currentOrg.siteName}/settings/teams`}
          />

          <div class="mt-5 flex flex-row-reverse items-center gap-2">
            <Button variant="secondary" type="button" onclick={onSubmit} loading={peopleApi.isLoading}>
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

          <BulkEmailSection onInvite={inviteNewStudents} disabled={$isStudentLimitReached} />
        </div>
      </UnderlineTabs.Content>
    </UnderlineTabs.Root>
  </Dialog.Content>
</Dialog.Root>
