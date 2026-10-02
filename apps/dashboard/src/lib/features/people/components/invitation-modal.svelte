<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import * as Alert from '@cio/ui/base/alert';
  import { Button } from '@cio/ui/base/button';
  import { ROLE } from '@cio/utils/constants';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi } from '$features/course/api';
  import { currentOrg, isStudentLimitReached } from '$lib/utils/store/org';
  import { peopleApi } from '$features/course/api';
  import { orgApi } from '$features/org/api/org.svelte';
  import { DEFAULT_ORG_AUDIENCE_QUERY } from '$features/org/utils/audience-query-utils';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { BulkEnrollOutcome } from '$features/learning-path/utils/types';
  import { profile } from '$lib/utils/store/user';
  import { buildResourceInviteLink } from '$features/people/utils/invite-link-utils';
  import {
    getInviteCandidateStudents,
    getInviteCandidateTutors,
    type InviteRosterMember
  } from '$features/people/utils/invite-modal-utils';
  import {
    TutorSelectSection,
    ExistingStudentsSection,
    BulkEmailSection,
    InviteLinkSection
  } from '$features/people/components';
  import { pathInviteLinkApi, pathMembersApi, isQueuedAddMembersResult } from '$features/learning-path/api';
  import { UpgradeBanner } from '$features/ui';

  interface Props {
    /** Called after the roster changes so the caller can refresh its list. */
    onMembersChanged?: () => void;
    /**
     * Which resource members are added to. Defaults to the course context
     * (`courseApi`) so existing course callers keep working unchanged; pass
     * `LEARNING_PATH` with the path id for learning paths. Student invites
     * and share links only ever mint STUDENT joins, which is why tutors are
     * added through the tutors tab on both resources.
     */
    resourceType?: 'COURSE' | 'LEARNING_PATH';
    /** Path id when `resourceType` is `LEARNING_PATH`. */
    resourceId?: string;
    /** Dialog title translation key. */
    titleKey?: string;
    /** Invite-link section description translation key. */
    linkDescriptionKey?: string;
    /** Bulk-email section copy keys (learning paths override the course defaults). */
    bulkTitleKey?: string;
    bulkDescriptionKey?: string;
    bulkSubmitKey?: string;
  }

  let {
    onMembersChanged,
    resourceType = 'COURSE',
    resourceId = '',
    titleKey = 'course.navItem.people.invite_modal.title',
    linkDescriptionKey = 'invite_link.course_description',
    bulkTitleKey,
    bulkDescriptionKey,
    bulkSubmitKey
  }: Props = $props();

  const isLearningPath = $derived(resourceType === 'LEARNING_PATH');
  const resourceName = $derived(isLearningPath ? resourceId : (courseApi.course?.id ?? ''));
  // Course and path workspaces both run under the current org, matching
  // `/courses/[id]` which carries no org slug either.
  const resourceOrgId = $derived($currentOrg.id);

  // Path-gated courses enroll students through their containing path only.
  // Student invites and share links mint STUDENT joins, so both tabs are
  // disabled here while tutors stay invitable. The backend still enforces
  // the gate; this only saves the admin a wasted round-trip.
  const isPathGated = $derived(!isLearningPath && Boolean(courseApi.course?.requiresLearningPath));

  let selectedIds = $state<string[]>([]);
  let courseId = $derived(courseApi.course?.id ?? '');
  const addPeopleParm = $derived(new URLSearchParams(page.url.search).get('add'));
  const isOpen = $derived(addPeopleParm === 'true');

  const tutors = $derived.by(() => getInviteCandidateTutors(orgApi.teamMembers, roster));
  const selectedTutors = $derived(tutors.filter((t) => selectedIds.includes(t.id.toString())));
  const INVITE_MODAL = 'course.navItem.people.invite_modal';

  let isLoadingStudents = $state(false);
  let activeTab = $state<'tutors' | 'students' | 'link'>('students');
  let queuedJobId = $state<string | null>(null);
  let activeQueuedToastId: string | null = null;

  const QUEUED_POLL_FALLBACK_MS = 3_000;
  const availableStudents = $derived.by(() => getInviteCandidateStudents(orgApi.audience, roster));

  /** Normalizes the course and path rosters so exclusion logic is written once. */
  const roster = $derived.by((): InviteRosterMember[] => {
    if (isLearningPath) {
      return pathMembersApi.members.map((member) => ({
        profileId: member.profileId,
        roleId: Number(member.roleId),
        email: member.profileEmail ?? member.email ?? null
      }));
    }

    return courseApi.group.people.map((member) => ({
      profileId: member.profileId ?? null,
      roleId: Number(member.roleId),
      email: member.profile?.email ?? member.email ?? null
    }));
  });

  const inviteLink = $derived.by(() => {
    if (isLearningPath) {
      return buildResourceInviteLink(pathInviteLinkApi.inviteLink?.token, $currentOrg);
    }

    return buildResourceInviteLink(peopleApi.inviteLink?.token, $currentOrg);
  });
  const inviteLinkState = $derived.by(() => {
    if (isLearningPath) {
      return {
        isRevoked: pathInviteLinkApi.inviteLink?.isRevoked ?? false,
        isLoading: pathInviteLinkApi.isLoading,
        joinCount: pathInviteLinkApi.inviteLink?.joinCount
      };
    }

    return {
      isRevoked: peopleApi.inviteLink?.isRevoked ?? false,
      isLoading: peopleApi.isLoading,
      joinCount: peopleApi.inviteLink?.joinCount
    };
  });

  function loadTeam(orgId: string | undefined) {
    if (!orgId) return;
    untrack(async () => {
      await orgApi.getOrgTeam();
      if (orgApi.error) {
        console.error('Error fetching teams', orgApi.error);
      }
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
    const orgId = resourceOrgId;
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

  /**
   * Replaces a still-open queued-enrollment toast with a "continues in the
   * background" notice. Called when the modal unmounts mid-run or when a new
   * run supersedes the previous one, so the spinner never hangs.
   */
  function resolveAbandonedQueuedToast() {
    if (!activeQueuedToastId) return;

    snackbar.info(t.get('learningPath.people.invite_modal.bulk_enroll_backgrounded'), activeQueuedToastId);
    activeQueuedToastId = null;
  }

  /**
   * Starts polling a queued path bulk-enroll in a single loading toast.
   * The modal closes immediately; the toast spins until the run resolves.
   * @param jobId Queued bulk-enroll job id.
   * @param requested Number of members requested, for the queued copy.
   */
  async function handleQueuedEnroll(jobId: string, requested: number) {
    if (queuedJobId) {
      resolveAbandonedQueuedToast();
    }
    closeModal();
    queuedJobId = jobId;
    // One toast for the whole run: it spins while polling, then becomes the
    // outcome in place rather than a second toast arriving beside it.
    const toastId = snackbar.loading(
      t.get('learningPath.people.invite_modal.bulk_enroll_queued', { count: requested })
    );
    activeQueuedToastId = toastId;
    await pollQueuedEnroll(jobId, toastId);
  }

  /**
   * Polls a queued path add to its terminal state, resolving the spinner
   * toast into the outcome summary. The loop exits as soon as `queuedJobId`
   * no longer names this job. Unmounting stops polling and hands the toast a
   * "continues in the background" message via `resolveAbandonedQueuedToast`.
   */
  async function pollQueuedEnroll(jobId: string, toastId: string) {
    for (let pollCount = 0; queuedJobId === jobId; pollCount += 1) {
      const envelope = await pathMembersApi.getBulkEnrollStatus(resourceName, jobId, pollCount);
      if (queuedJobId !== jobId) return;

      if (!envelope) {
        queuedJobId = null;
        activeQueuedToastId = null;
        snackbar.error(t.get('learningPath.people.invite_modal.bulk_enroll_lost'), toastId);
        return;
      }

      const { job, nextPollMs } = envelope;

      if (job.status === 'completed') {
        const outcome = job.result as BulkEnrollOutcome | null;
        queuedJobId = null;
        activeQueuedToastId = null;

        if (outcome && outcome.failed.length > 0) {
          snackbar.success(
            t.get('learningPath.people.invite_modal.bulk_enroll_partial', {
              enrolled: outcome.enrolled,
              invited: outcome.invited,
              failed: outcome.failed.length
            }),
            toastId
          );
        } else {
          snackbar.success(
            t.get('learningPath.people.invite_modal.bulk_enroll_success', {
              enrolled: outcome?.enrolled ?? 0,
              invited: outcome?.invited ?? 0
            }),
            toastId
          );
        }

        onMembersChanged?.();
        return;
      }

      if (job.status === 'failed' || job.status === 'canceled') {
        queuedJobId = null;
        activeQueuedToastId = null;
        snackbar.error(t.get('learningPath.people.invite_modal.bulk_enroll_failed'), toastId);
        onMembersChanged?.();
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, nextPollMs ?? QUEUED_POLL_FALLBACK_MS));
    }
  }

  onDestroy(() => {
    resolveAbandonedQueuedToast();
    queuedJobId = null;
  });

  async function assignExistingStudents(profileIds: string[], sendEmail: boolean) {
    if (isLearningPath) {
      const result = await pathMembersApi.addMembers(
        resourceName,
        profileIds.map((profileId) => ({ profileId, roleId: ROLE.STUDENT })),
        sendEmail
      );

      if (!result) {
        return;
      }

      if (isQueuedAddMembersResult(result.data)) {
        await handleQueuedEnroll(result.data.jobId, result.data.requested);
        return;
      }

      if (result?.success) {
        onMembersChanged?.();
      }

      return;
    }

    const result = await orgApi.assignAudienceToCourses({
      profileIds,
      courseIds: [courseId],
      sendEmail
    });

    if (!result) {
      return;
    }

    await courseApi.refreshCourse(courseId, $profile.id);
    onMembersChanged?.();
  }

  async function inviteNewStudents(recipientCsv: string, sendEmail: boolean) {
    if (isLearningPath) {
      const response = await orgApi.importAudienceMembers({
        recipientCsv,
        pathIds: [resourceName],
        sendEmail
      });

      if (!response) {
        return;
      }

      onMembersChanged?.();
      return;
    }

    const response = await orgApi.importAudienceMembers({
      recipientCsv,
      courseIds: [courseId],
      sendEmail
    });

    if (!response) {
      return;
    }

    await courseApi.refreshCourse(courseId, $profile.id);
    onMembersChanged?.();
  }

  async function generateInviteLink() {
    if (isLearningPath) {
      await pathInviteLinkApi.generateInviteLink(resourceName);
      return;
    }

    await peopleApi.generateInviteLink(courseId);
  }

  async function toggleInviteLink(isRevoked: boolean) {
    if (isLearningPath) {
      await pathInviteLinkApi.toggleInviteLink(resourceName, isRevoked);
      return;
    }

    await peopleApi.toggleInviteLink(courseId, isRevoked);
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

    if (isLearningPath) {
      const result = await pathMembersApi.addMembers(resourceName, members);

      if (!result) {
        return;
      }

      if (isQueuedAddMembersResult(result.data)) {
        await handleQueuedEnroll(result.data.jobId, result.data.requested);
        return;
      }

      if (result?.success) {
        selectedIds = [];
        onMembersChanged?.();
        closeModal();
      }

      return;
    }

    await peopleApi.add(courseId, members);
    if (peopleApi.success) {
      selectedIds = [];
      await courseApi.refreshCourse(courseId, $profile.id);
      onMembersChanged?.();
      goto(resolve(page.url.pathname, {}));
    }
  }

  function closeModal() {
    selectedIds = [];
    goto(resolve(page.url.pathname, {}));
  }

  $effect(() => {
    // Course context only: the open effect below owns team loading with the
    // resolved org, so an org change must not overwrite it with header-org
    // data while this modal serves a learning path.
    if (isLearningPath) return;
    loadTeam($currentOrg.id);
  });

  $effect(() => {
    // Tracked so a full reload on `?add=true` refires once org state
    // hydrates: `loadStudents` early-returns without an org id, and reads
    // inside `untrack` would otherwise never retry, leaving an empty list.
    // On path routes this is the path's org (passed in); on course routes
    // it falls back to the current org, which the org layout pins.
    const resolvedOrgId = resourceOrgId;

    if (!isOpen || !resourceName || !resolvedOrgId) return;
    untrack(() => {
      activeTab = isPathGated ? 'tutors' : 'students';
      selectedIds = [];
      void loadTeam(resolvedOrgId);
      void loadStudents(resolvedOrgId);

      if (isLearningPath) {
        void pathInviteLinkApi.getInviteLink(resourceName);
      } else {
        void peopleApi.getInviteLink(courseId);
      }
    });
  });

  // Drop selections that are no longer offered so a stale id can never be resubmitted.
  // A course that becomes path-gated while open parks the viewer on tutors.
  $effect(() => {
    if (isPathGated && activeTab !== 'tutors') {
      activeTab = 'tutors';
      return;
    }

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
      <Dialog.Title>{$t(titleKey)}</Dialog.Title>
    </Dialog.Header>

    <UnderlineTabs.Root bind:value={activeTab}>
      <UnderlineTabs.List class="flex flex-wrap">
        <UnderlineTabs.Trigger value="tutors">
          {$t(`${INVITE_MODAL}.invite`)}
        </UnderlineTabs.Trigger>
        <UnderlineTabs.Trigger value="students" disabled={isPathGated}>
          {$t(`${INVITE_MODAL}.invite_students`)}
        </UnderlineTabs.Trigger>
        <UnderlineTabs.Trigger value="link" disabled={isPathGated}>
          {$t('invite_link.tab_label')}
        </UnderlineTabs.Trigger>
      </UnderlineTabs.List>

      <UnderlineTabs.Content value="tutors">
        <div class="space-y-3">
          {#if isPathGated}
            <Alert.Callout
              variant="warning"
              title={$t(`${INVITE_MODAL}.path_gated_notice_title`)}
              description={$t(`${INVITE_MODAL}.path_gated_notice_description`)}
            />
          {/if}
          <TutorSelectSection
            {tutors}
            bind:selectedIds
            isLoading={orgApi.isLoading}
            helperHref={`/org/${$currentOrg.siteName}/settings/teams`}
          />

          <div class="mt-5 flex flex-row-reverse items-center gap-2">
            <Button
              variant="secondary"
              type="button"
              testId="invitation-modal-tutors-submit"
              onclick={onSubmit}
              loading={isLearningPath ? pathMembersApi.isLoading : peopleApi.isLoading}
            >
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
            titleKey={bulkTitleKey}
            descriptionKey={bulkDescriptionKey}
            submitKey={bulkSubmitKey}
          />
        </div>
      </UnderlineTabs.Content>

      <UnderlineTabs.Content value="link">
        <div class="space-y-6">
          <InviteLinkSection
            link={inviteLink}
            isRevoked={inviteLinkState.isRevoked}
            isLoading={inviteLinkState.isLoading}
            joinCount={inviteLinkState.joinCount}
            descriptionKey={linkDescriptionKey}
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
