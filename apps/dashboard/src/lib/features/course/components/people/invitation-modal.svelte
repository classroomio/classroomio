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
  import {
    DEFAULT_INVITE_SETTINGS_STATE,
    DEFAULT_STUDENT_INVITE_LINK_STATE,
    inviteSettingsStore,
    studentInviteLinkStore
  } from './store';
  import type { Tutor } from './types';

  import TutorSelectSection from './tutor-select-section.svelte';
  import InviteSettingsSection from './invite-settings-section.svelte';
  import QuickLinkSection from './quick-link-section.svelte';
  import BulkEmailSection from './bulk-email-section.svelte';
  import InviteListSection from './invite-list-section.svelte';
  import type { InviteListItem } from './types';

  let tutors = $state<Tutor[]>([]);
  let selectedIds = $state<string[]>([]);
  let courseId = $derived(courseApi.course?.id ?? '');
  const addPeopleParm = $derived(new URLSearchParams(page.url.search).get('add'));
  const isOpen = $derived(addPeopleParm === 'true');

  const selectedTutors = $derived(tutors.filter((t) => selectedIds.includes(t.id.toString())));
  const INVITE_MODAL = 'course.navItem.people.invite_modal';

  let existingInvites = $state<InviteListItem[]>([]);
  let isLoadingInvites = $state(false);
  let activeTab = $state<'tutors' | 'students'>('tutors');
  let activeStudentTab = $state<'quick-link' | 'email' | 'history'>('quick-link');

  async function loadInvites() {
    if (!courseId) return;
    isLoadingInvites = true;
    try {
      const invites = await peopleApi.listStudentInvites(courseId);
      existingInvites = (invites || []) as InviteListItem[];
    } finally {
      isLoadingInvites = false;
    }
  }

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
      activeTab = 'tutors';
      activeStudentTab = 'quick-link';
      inviteSettingsStore.set({ ...DEFAULT_INVITE_SETTINGS_STATE });
      studentInviteLinkStore.set({ ...DEFAULT_STUDENT_INVITE_LINK_STATE });
      void loadInvites();
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
          <InviteSettingsSection />

          <UnderlineTabs.Root bind:value={activeStudentTab}>
            <UnderlineTabs.List class="flex flex-wrap">
              <UnderlineTabs.Trigger value="quick-link">
                {$t(`${INVITE_MODAL}.quick_invite_link`)}
              </UnderlineTabs.Trigger>
              <UnderlineTabs.Trigger value="email">
                {$t(`${INVITE_MODAL}.direct_email_bulk`)}
              </UnderlineTabs.Trigger>
              <UnderlineTabs.Trigger value="history">
                {$t(`${INVITE_MODAL}.existing_invites`)}
              </UnderlineTabs.Trigger>
            </UnderlineTabs.List>

            <UnderlineTabs.Content value="quick-link">
              <div class="mt-6">
                <QuickLinkSection {courseId} {isOpen} onInviteCreated={loadInvites} />
              </div>
            </UnderlineTabs.Content>

            <UnderlineTabs.Content value="email">
              <div class="mt-6">
                <BulkEmailSection {courseId} onInviteCreated={loadInvites} />
              </div>
            </UnderlineTabs.Content>

            <UnderlineTabs.Content value="history">
              <div class="mt-6">
                <InviteListSection
                  {courseId}
                  invites={existingInvites}
                  isLoading={isLoadingInvites}
                  onRefresh={loadInvites}
                />
              </div>
            </UnderlineTabs.Content>
          </UnderlineTabs.Root>
        </div>
      </UnderlineTabs.Content>
    </UnderlineTabs.Root>
  </Dialog.Content>
</Dialog.Root>
