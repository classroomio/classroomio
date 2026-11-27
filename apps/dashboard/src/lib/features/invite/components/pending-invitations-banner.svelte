<script lang="ts">
  import * as Alert from '@cio/ui/base/alert';
  import { Button } from '@cio/ui/base/button';
  import MailOpenIcon from '@lucide/svelte/icons/mail-open';
  import { t } from '$lib/utils/functions/translations';
  import { pendingInvitationsApi } from '../api/pending-invitations.svelte';
</script>

{#if pendingInvitationsApi.count > 0}
  <Alert.Root
    class="ui:bg-primary ui:text-primary-foreground ui:border-primary mb-4 flex items-center gap-3"
    data-testid="pending-invitations-banner"
  >
    <MailOpenIcon class="size-4 shrink-0" />
    <div class="flex-1">
      <Alert.Title>{$t('my_learning.pending_invites.title')}</Alert.Title>
      <Alert.Description class="ui:text-primary-foreground/80"
        >{$t('my_learning.pending_invites.description')}</Alert.Description
      >
    </div>
    <Button
      size="sm"
      variant="secondary"
      testId="my-learning-review-invites"
      onclick={() => pendingInvitationsApi.openModal()}
    >
      {$t('my_learning.pending_invites.review')}
    </Button>
  </Alert.Root>
{/if}
