<script lang="ts">
  import InfoIcon from '@lucide/svelte/icons/info';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import { Badge, type BadgeVariant } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import * as Sheet from '@cio/ui/base/sheet';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import * as Table from '@cio/ui/base/table';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import type { TLiveSessionReminderStatus } from '@cio/utils/constants/live-session-reminder';

  import { t } from '$lib/utils/functions/translations';
  import { TablePagination } from '$features/ui';
  import { liveSessionReminderApi } from '$features/course/api';
  import { splitReminderOffset } from '$features/course/utils/live-session-reminder-utils';
  import type { LiveSessionReminderDelivery } from '$features/course/utils/types';

  interface Props {
    courseId: string;
    timezone?: string | null;
  }

  let { courseId, timezone }: Props = $props();

  const T = 'course.navItem.settings.live_session_reminders';

  const STATUS_BADGE_VARIANTS: Record<TLiveSessionReminderStatus, BadgeVariant> = {
    pending: 'outline',
    queued: 'secondary',
    sent: 'success',
    failed: 'destructive',
    skipped: 'warning'
  };

  let open = $state(false);
  let currentPage = $state(1);

  const deliveries = $derived(liveSessionReminderApi.deliveries);
  const pagination = $derived(liveSessionReminderApi.pagination);

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;

    if (!isOpen) return;

    currentPage = 1;
    liveSessionReminderApi.reset();
    void liveSessionReminderApi.listDeliveries(courseId, 1);
  }

  function changePage(nextPage: number) {
    currentPage = nextPage;
    void liveSessionReminderApi.listDeliveries(courseId, nextPage);
  }

  function refresh() {
    void liveSessionReminderApi.listDeliveries(courseId, currentPage);
  }

  function formatSessionTime(lessonAt: string) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
        ...(timezone ? { timeZone: timezone } : {})
      }).format(new Date(lessonAt));
    } catch {
      return new Date(lessonAt).toLocaleString();
    }
  }

  function formatOffset(offsetMinutes: number) {
    const { amount, unit } = splitReminderOffset(offsetMinutes);
    const duration = $t(`${T}.duration.${unit}`, { count: amount });

    return $t(`${T}.offset_before`, { duration });
  }

  function getDetail(delivery: LiveSessionReminderDelivery) {
    if (delivery.status === 'failed' && delivery.lastError) return delivery.lastError;
    if (delivery.status === 'skipped' && delivery.skipReason) return $t(`${T}.skip_reasons.${delivery.skipReason}`);

    return '';
  }
</script>

<Field.Field orientation="horizontal">
  <Field.Content>
    <Field.Label>{$t(`${T}.log.title`)}</Field.Label>
    <Field.Description>{$t(`${T}.log.description`)}</Field.Description>
  </Field.Content>

  <Sheet.Root {open} onOpenChange={handleOpenChange}>
    <Sheet.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="secondary" size="sm" class="shrink-0" testId="live-session-reminders-view-logs">
          {$t(`${T}.log.view`)}
        </Button>
      {/snippet}
    </Sheet.Trigger>
    <Sheet.Content class="w-full sm:max-w-3xl" data-testid="live-session-reminders-log">
      <Sheet.Header>
        <div class="flex items-start justify-between gap-2 pr-8">
          <div class="flex flex-col gap-1.5">
            <Sheet.Title>{$t(`${T}.log.title`)}</Sheet.Title>
            <Sheet.Description>{$t(`${T}.log.description`)}</Sheet.Description>
          </div>
          <IconButton
            variant="secondary"
            size="icon-sm"
            tooltip={$t('common.refresh')}
            aria-label={$t('common.refresh')}
            onclick={refresh}
          >
            <RefreshCwIcon />
          </IconButton>
        </div>
      </Sheet.Header>

      <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-4 pb-4">
        <div class="ui:border-border overflow-x-auto rounded-md border">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>{$t(`${T}.log.columns.session`)}</Table.Head>
                <Table.Head>{$t(`${T}.log.columns.student`)}</Table.Head>
                <Table.Head>{$t(`${T}.log.columns.reminder`)}</Table.Head>
                <Table.Head>{$t(`${T}.log.columns.status`)}</Table.Head>
                <Table.Head class="w-10"><span class="sr-only">{$t(`${T}.log.columns.detail`)}</span></Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#if !deliveries}
                {#each [0, 1, 2] as index (index)}
                  <Table.Row>
                    {#each [0, 1, 2, 3, 4] as cell (cell)}
                      <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
                    {/each}
                  </Table.Row>
                {/each}
              {:else if deliveries.length === 0}
                <Table.Row>
                  <Table.Cell colspan={5} class="ui:text-muted-foreground py-8 text-center text-sm">
                    {$t(`${T}.log.empty`)}
                  </Table.Cell>
                </Table.Row>
              {:else}
                {#each deliveries as delivery (delivery.id)}
                  {@const detail = getDetail(delivery)}
                  <Table.Row>
                    <Table.Cell>
                      <div class="flex flex-col">
                        <span class="font-medium">{delivery.lessonTitle}</span>
                        <span class="ui:text-muted-foreground text-xs">{formatSessionTime(delivery.lessonAt)}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>{delivery.studentName}</Table.Cell>
                    <Table.Cell>{formatOffset(delivery.offsetMinutes)}</Table.Cell>
                    <Table.Cell>
                      <Badge variant={STATUS_BADGE_VARIANTS[delivery.status]}>
                        {$t(`${T}.statuses.${delivery.status}`)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      {#if detail}
                        <Tooltip.Provider>
                          <Tooltip.Root>
                            <Tooltip.Trigger aria-label={detail}>
                              <InfoIcon class="ui:text-muted-foreground size-4" />
                            </Tooltip.Trigger>
                            <Tooltip.Content side="left" class="max-w-xs">{detail}</Tooltip.Content>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                      {/if}
                    </Table.Cell>
                  </Table.Row>
                {/each}
              {/if}
            </Table.Body>
          </Table.Root>
        </div>

        {#if pagination && pagination.totalPages > 1}
          <TablePagination
            count={pagination.total}
            perPage={pagination.limit}
            page={currentPage}
            onPageChange={changePage}
          />
        {/if}
      </div>
    </Sheet.Content>
  </Sheet.Root>
</Field.Field>
