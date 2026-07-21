<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi } from '$features/course/api';
  import { orgApi } from '$features/org/api/org.svelte';
  import { profile } from '$lib/utils/store/user';
  import { isStudentLimitReached } from '$lib/utils/store/org';
  import { UpgradeBanner } from '$features/ui';

  const GRANT_ACCESS_PARAM = 'grantAccess';

  let courseId = $derived(courseApi.course?.id ?? '');
  const studentEmail = $derived(new URLSearchParams(page.url.search).get(GRANT_ACCESS_PARAM)?.trim() ?? '');
  const isOpen = $derived(Boolean(studentEmail));

  let isSubmitting = $state(false);

  function closeModal() {
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
      const response = await orgApi.importAudienceMembers({
        recipientCsv: studentEmail,
        courseIds: [courseId],
        sendEmail: true
      });

      if (!response) {
        return;
      }

      await courseApi.refreshCourse(courseId, $profile.id);
      closeModal();
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
      <Dialog.Title>{$t('course.navItem.people.grant_access_modal.title')}</Dialog.Title>
      <Dialog.Description>
        {$t('course.navItem.people.grant_access_modal.description', { email: studentEmail })}
      </Dialog.Description>
    </Dialog.Header>

    {#if $isStudentLimitReached}
      <UpgradeBanner removeParams={[GRANT_ACCESS_PARAM]}>
        {$t('course.navItem.people.invite_modal.student_limit_reached')}
      </UpgradeBanner>
    {/if}

    <div class="flex justify-end gap-2">
      <Button type="button" variant="outline" onclick={closeModal} disabled={isSubmitting}>
        {$t('course.navItem.people.grant_access_modal.cancel')}
      </Button>
      <Button
        type="button"
        variant="secondary"
        onclick={handleSendInvite}
        loading={isSubmitting}
        disabled={$isStudentLimitReached || !studentEmail}
      >
        {$t('course.navItem.people.grant_access_modal.send_invite')}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
