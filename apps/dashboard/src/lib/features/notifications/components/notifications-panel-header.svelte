<script lang="ts">
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
  import MessageSquarePlusIcon from '@lucide/svelte/icons/message-square-plus';
  import { Button } from '@cio/ui/base/button';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { globalStore } from '$lib/utils/store/app';
  import { showUserJotWidget } from '$lib/utils/services/userjot';
  import { t } from '$lib/utils/functions/translations';
</script>

<div class="flex items-center justify-between gap-2 px-4 py-3">
  <p class="text-lg font-normal tracking-tight">{$t('notifications.title')}</p>

  <div class="flex items-center gap-2">
    <!-- TODO: "Only show unread" toggle belongs here. Hidden until read state exists —
         every notification is unread today, so it would filter nothing.
         See prd/notification-system/README.md (notification.isRead). -->

    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Button {...props} variant="secondary" size="icon" class="size-7">
            <EllipsisIcon class="size-4" />
            <span class="sr-only">{$t('notifications.more_options')}</span>
          </Button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <!-- TODO: "Mark all as read" belongs here, but it needs persisted read state.
             Every notification is unread today, so there is nothing to mark.
             See prd/notification-system/README.md (notification.isRead, markAllAsRead). -->
        {#if !$globalStore.isOrgSite}
          <DropdownMenu.Item onclick={() => showUserJotWidget('feedback')}>
            <span class="flex w-full items-center gap-2">
              <MessageSquarePlusIcon size={16} />
              <p class="text-sm">{$t('notifications.give_feedback')}</p>
            </span>
          </DropdownMenu.Item>
        {/if}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>
</div>
