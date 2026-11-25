<script lang="ts">
  import { profile } from '$lib/utils/store/user';
  import { pendingCourseInvitesApi } from '../api/pending-course-invites.svelte';
  import { hasPromptedThisSession, markPromptedThisSession } from '../utils/course-invite-prompt';
  import PendingCourseInvitesModal from './pending-course-invites-modal.svelte';

  $effect(() => {
    if (!$profile.id) return;

    void $profile.isEmailVerified;
    void pendingCourseInvitesApi.fetchOnce();
  });

  $effect(() => {
    if (!pendingCourseInvitesApi.hasLoaded || pendingCourseInvitesApi.count === 0) return;
    if (hasPromptedThisSession()) return;

    markPromptedThisSession();
    pendingCourseInvitesApi.openModal();
  });
</script>

<PendingCourseInvitesModal />
