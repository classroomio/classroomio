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
  import { currentOrg } from '$lib/utils/store/org';
  import { peopleApi } from '$features/course/api';
  import { orgApi } from '$features/org/api/org.svelte';
  import type { OrgTeamMember } from '$lib/utils/types/org';
  import type { OrgStudent, Tutor } from './types';

  import TutorSelectSection from './tutor-select-section.svelte';
  import ExistingStudentsSection from './existing-students-section.svelte';
  import BulkEmailSection from './bulk-email-section.svelte';

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
        await orgApi.getOrgAudience(orgId);
      } finally {
        isLoadingStudents = false;
      }
    });
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
  <Dialog.Content class="max-h-[80vh] w-[96vw] max-w-6xl overflow-y-auto">
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
        <div class="mt-6 space-y-6">
          <TutorSelectSection {tutors} bind:selectedIds isLoading={orgApi.isLoading} />

          <div class="mt-5 flex flex-row-reverse items-center gap-2">
            <Button variant="secondary" type="button" onclick={onSubmit} loading={peopleApi.isLoading}>
              {$t(`${INVITE_MODAL}.finish`)}
            </Button>
          </div>
        </div>
      </UnderlineTabs.Content>

      <UnderlineTabs.Content value="students">
        <div class="mt-6 space-y-6">
          <ExistingStudentsSection {courseId} students={availableStudents} isLoading={isLoadingStudents} />
          <BulkEmailSection {courseId} />
        </div>
      </UnderlineTabs.Content>
    </UnderlineTabs.Root>
  </Dialog.Content>
</Dialog.Root>
