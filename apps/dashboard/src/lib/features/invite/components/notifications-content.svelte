<script lang="ts">
  import BellIcon from '@lucide/svelte/icons/bell';
  import RefreshCcwIcon from '@lucide/svelte/icons/refresh-ccw';
  import { Button } from '@cio/ui/base/button';
  import * as Empty from '@cio/ui/base/empty';
  import { resolve } from '$app/paths';
  import { t } from '$lib/utils/functions/translations';
  import { pendingInvitesApi } from '../api/pending-invites.svelte';

  const invites = $derived(pendingInvitesApi.invites);
</script>

{#if invites.length === 0}
  <Empty.Root class="ui:from-muted/50 ui:to-background ui:h-full ui:bg-gradient-to-b ui:from-30%">
    <Empty.Header>
      <Empty.Media variant="icon">
        <BellIcon />
      </Empty.Media>
      <Empty.Title>{$t('notifications.empty_title')}</Empty.Title>
      <Empty.Description>{$t('notifications.empty_description')}</Empty.Description>
    </Empty.Header>
    <Empty.Content>
      <Button
        variant="outline"
        size="sm"
        loading={pendingInvitesApi.isLoading}
        onclick={() => pendingInvitesApi.fetchPendingInvites()}
      >
        <RefreshCcwIcon />
        {$t('notifications.refresh')}
      </Button>
    </Empty.Content>
  </Empty.Root>
{:else}
  <div class="flex flex-col gap-1">
    <p class="ui:text-muted-foreground px-2 pb-1 text-xs font-medium">{$t('notifications.title')}</p>

    {#each invites as invite (invite.id)}
      <a
        href={resolve(`/invite/pending/${invite.id}`, {})}
        class="ui:hover:bg-muted flex flex-col gap-1 rounded-md p-2 transition-colors"
      >
        <span class="text-sm font-medium">{$t('notifications.pending_invite.heading')}</span>
        <span class="ui:text-muted-foreground text-xs">
          {$t('notifications.pending_invite.body', {
            orgName: invite.organization.name,
            role: invite.roleLabel
          })}
        </span>
        <span class="ui:text-primary text-xs">{$t('notifications.pending_invite.action')}</span>
      </a>
    {/each}
  </div>
{/if}
