<script lang="ts">
  import * as Empty from '@cio/ui/base/empty';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import { pendingInvitationsApi } from '$features/invite/api/pending-invitations.svelte';
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
  // Always false while the toggle is hidden; the filter stays wired so re-enabling is one line.
  const onlyUnread = false;

  const visible = $derived(filterByUnread(notificationsApi.items, onlyUnread));

  function handleSelect(item: NotificationItem) {
    if (item.kind === 'org_invite' || item.kind === 'course_invite') {
      pendingInvitationsApi.openModal();
    }
  }
</script>

<NotificationsPanelHeader />

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
    <Empty.Root>
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
