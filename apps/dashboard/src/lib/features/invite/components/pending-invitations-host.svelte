<script lang="ts">
  import { profile } from '$lib/utils/store/user';
  import { pendingInvitationsApi } from '../api/pending-invitations.svelte';
  import { hasPromptedThisSession, markPromptedThisSession } from '../utils/course-invite-prompt';

  $effect(() => {
    if (!$profile.id) return;

    void $profile.isEmailVerified;
    void pendingInvitationsApi.fetchOnce();
  });

  $effect(() => {
    if (!pendingInvitationsApi.hasLoaded || pendingInvitationsApi.count === 0) return;
    if (hasPromptedThisSession()) return;

    markPromptedThisSession();
    pendingInvitationsApi.openModal();
  });
</script>
