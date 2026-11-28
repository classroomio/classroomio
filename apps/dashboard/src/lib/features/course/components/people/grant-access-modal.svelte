<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import InviteOutcomeList from '$features/course/components/people/invite-outcome-list.svelte';
  import { courseApi, peopleApi } from '$features/course/api';
  import {
    getCourseInviteOutcomeLabelKey,
    getFailedDeliveryEmails
  } from '$features/course/components/people/invite-utils';
  import { profile } from '$lib/utils/store/user';
  import { isStudentLimitReached } from '$lib/utils/store/org';
  import { UpgradeBanner } from '$features/ui';

  interface Props {
    /** Called after the course roster changes so the caller can refresh its list. */
    onMembersChanged?: () => void;
  }

  let { onMembersChanged }: Props = $props();

  const GRANT_ACCESS_PARAM = 'grantAccess';

  let courseId = $derived(courseApi.course?.id ?? '');
  const studentEmail = $derived(new URLSearchParams(page.url.search).get(GRANT_ACCESS_PARAM)?.trim() ?? '');
  const isOpen = $derived(Boolean(studentEmail));

  let isSubmitting = $state(false);
  let outcome = $state<{ email: string; labelKey: string } | null>(null);

  function closeModal() {
    outcome = null;
    const nextParams = new URLSearchParams(page.url.search);
    nextParams.delete(GRANT_ACCESS_PARAM);
    const query = nextParams.toString();

    goto(resolve(`${page.url.pathname}${query ? `?${query}` : ''}`, {}));
  }

  async function handleSendInvite() {
    if (!courseId || !studentEmail || $isStudentLimitReached) {
      return;
    }

    isSubmitting = true;

    try {
      const invite = await peopleApi.createStudentInvite(courseId, {
        recipientEmails: [studentEmail],
        sendEmail: true
      });
      const recipient = invite?.recipients[0];
      if (!recipient) {
        return;
      }

      const failedEmails = getFailedDeliveryEmails(invite.delivery);
      const emailFailed = failedEmails.has(recipient.email.toLowerCase());
      const accessChanged = recipient.status === 'invited' || recipient.status === 'enrolled';
      if (accessChanged) {
        await courseApi.refreshCourse(courseId, $profile.id);
        onMembersChanged?.();
      }

      if (accessChanged && !emailFailed) {
        closeModal();
        return;
      }

      outcome = {
        email: recipient.email,
        labelKey: getCourseInviteOutcomeLabelKey(recipient, failedEmails)
      };
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Dialog.Root
  open={isOpen}
  onOpenChange={(open) => {
    if (!open) closeModal();
  }}
>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.people.invite_modal.grant_access_modal.title')}</Dialog.Title>
      <Dialog.Description>
        {$t('course.navItem.people.invite_modal.grant_access_modal.description', { email: studentEmail })}
      </Dialog.Description>
    </Dialog.Header>

    {#if $isStudentLimitReached}
      <UpgradeBanner removeParams={[GRANT_ACCESS_PARAM]}>
        {$t('course.navItem.people.invite_modal.student_limit_reached')}
      </UpgradeBanner>
    {/if}

    {#if outcome}
      <InviteOutcomeList titleKey="course.navItem.people.invite_modal.outcomes.title" items={[outcome]} />
    {/if}

    <div class="flex justify-end gap-2">
      <Button type="button" variant="outline" onclick={closeModal} disabled={isSubmitting}>
        {$t('course.navItem.people.invite_modal.grant_access_modal.cancel')}
      </Button>
      <Button
        type="button"
        variant="secondary"
        onclick={handleSendInvite}
        loading={isSubmitting}
        disabled={$isStudentLimitReached || !studentEmail}
      >
        {$t('course.navItem.people.invite_modal.grant_access_modal.send_invite')}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
