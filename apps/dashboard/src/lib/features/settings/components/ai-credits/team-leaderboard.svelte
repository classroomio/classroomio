<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import * as Table from '@cio/ui/base/table';
  import * as Avatar from '@cio/ui/base/avatar';
  import type { LeaderboardData } from '$features/settings/utils/types';

  interface Props {
    leaderboard: LeaderboardData | null;
  }

  let { leaderboard }: Props = $props();

  const entries = $derived(leaderboard?.entries ?? []);

  function initials(name: string | null, email: string | null) {
    const source = (name?.trim() || email || '?').split(/\s+/).filter(Boolean);

    return source
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
</script>

<div>
  <div class="mb-3 flex items-baseline justify-between gap-2">
    <h3 class="text-lg font-semibold tracking-tight">{$t('settings.ai_credits.leaderboard.title')}</h3>
    <p class="ui:text-muted-foreground text-xs">{$t('settings.ai_credits.leaderboard.this_month')}</p>
  </div>

  <div class="rounded-md border">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-10">#</Table.Head>
          <Table.Head>{$t('settings.ai_credits.leaderboard.user')}</Table.Head>
          <Table.Head>{$t('settings.ai_credits.leaderboard.favorite_model')}</Table.Head>
          <Table.Head class="text-right">{$t('settings.ai_credits.leaderboard.tokens')}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each entries as entry, index (entry.userId)}
          <Table.Row>
            <Table.Cell class="ui:text-muted-foreground">{index + 1}</Table.Cell>
            <Table.Cell>
              <div class="flex items-center gap-3">
                <Avatar.Root class="size-8">
                  {#if entry.avatarUrl}
                    <Avatar.Image src={entry.avatarUrl} alt={entry.fullname ?? ''} loading="lazy" decoding="async" />
                  {/if}
                  <Avatar.Fallback aria-hidden="true">{initials(entry.fullname, entry.email)}</Avatar.Fallback>
                </Avatar.Root>
                <div class="flex min-w-0 flex-col">
                  <span class="truncate text-sm font-medium">{entry.fullname ?? entry.email ?? '—'}</span>
                  <span class="ui:text-muted-foreground truncate text-xs">{entry.email ?? ''}</span>
                </div>
              </div>
            </Table.Cell>
            <Table.Cell class="ui:text-muted-foreground max-w-[12rem] truncate text-sm">
              {entry.favoriteModel ?? '—'}
            </Table.Cell>
            <Table.Cell class="text-right">
              <div class="inline-flex flex-col items-end gap-1">
                <span class="text-sm font-medium">{entry.tokens.toLocaleString()}</span>
                <div class="ui:bg-muted h-1 w-24 rounded-full">
                  <div
                    class="ui:bg-primary h-1 rounded-full"
                    style="width: {Math.min(100, Math.round(entry.percentage * 100))}%"
                  ></div>
                </div>
              </div>
            </Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell class="ui:text-muted-foreground py-8 text-center text-sm" colspan={4}>
              {$t('settings.ai_credits.leaderboard.empty')}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
</div>
