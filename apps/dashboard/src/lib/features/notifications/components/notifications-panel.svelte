<script lang="ts">
  import * as Empty from '@cio/ui/base/empty';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import { pendingInvitesApi } from '$features/invite/api/pending-invites.svelte';
  import PendingInviteModal from '$features/invite/components/pending-invite-modal.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { notificationsApi } from '../api/notifications.svelte';
  import { filterByUnread } from '../utils/notification-utils';
  import type { NotificationItem } from '../utils/types';
  import NotificationList from './notification-list.svelte';
  import NotificationsPanelHeader from './notifications-panel-header.svelte';

  const DIRECT_TAB = 'direct';
  const WATCHING_TAB = 'watching';

  // Kept as a plain string: UnderlineTabs.Root types `value` as string, so a union breaks bind:.
  let activeTab = $state(DIRECT_TAB);
  let onlyUnread = $state(false);
  let selectedInviteId = $state<string | null>(null);
  let isModalOpen = $state(false);

  const visible = $derived(filterByUnread(notificationsApi.items, onlyUnread));
  const selectedInvite = $derived(pendingInvitesApi.invites.find((invite) => invite.id === selectedInviteId));

  function handleSelect(item: NotificationItem) {
    if (item.kind === 'org_invite') {
      selectedInviteId = item.sourceId;
      isModalOpen = true;
    }
  }

  /**
   * Mirrors the org switcher: stash the site name, then hard-navigate so account data
   * refetches and the newly joined org becomes current.
   */
  function handleAccepted(redirectTo?: string) {
    const siteName = selectedInvite?.organization.siteName;
    selectedInviteId = null;

    if (siteName) {
      localStorage.setItem('classroomio_org_sitename', siteName);
    }

    window.location.href = redirectTo || '/org';
  }
</script>

<NotificationsPanelHeader bind:onlyUnread />

<UnderlineTabs.Root bind:value={activeTab} class="gap-0">
  <UnderlineTabs.List class="px-2">
    <UnderlineTabs.Trigger value={DIRECT_TAB}>{$t('notifications.tabs.direct')}</UnderlineTabs.Trigger>
    <UnderlineTabs.Trigger value={WATCHING_TAB}>{$t('notifications.tabs.watching')}</UnderlineTabs.Trigger>
  </UnderlineTabs.List>

  <UnderlineTabs.Content value={DIRECT_TAB}>
    <NotificationList
      items={visible}
      isLoading={notificationsApi.isLoading}
      hasLoaded={notificationsApi.hasLoaded}
      onSelect={handleSelect}
      onRefresh={() => notificationsApi.refresh()}
    />
  </UnderlineTabs.Content>

  <UnderlineTabs.Content value={WATCHING_TAB}>
    <Empty.Root class="ui:from-muted/50 ui:to-background ui:bg-gradient-to-b ui:from-30%">
      <Empty.Header>
        <Empty.Media variant="icon">
          <EyeIcon />
        </Empty.Media>
        <Empty.Title>{$t('notifications.watching_empty_title')}</Empty.Title>
        <Empty.Description>{$t('notifications.watching_empty_description')}</Empty.Description>
      </Empty.Header>
    </Empty.Root>
  </UnderlineTabs.Content>
</UnderlineTabs.Root>

{#if selectedInvite}
  <PendingInviteModal bind:open={isModalOpen} invite={selectedInvite} onAccepted={handleAccepted} />
{/if}
