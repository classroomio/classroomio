<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { SortPopover } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import type {
    OrganizationAudienceActivityWindow,
    OrganizationAudienceCompletion,
    OrganizationAudienceEnrollment,
    OrganizationAudienceInviteStatus,
    OrganizationAudienceMemberStatus,
    OrganizationAudienceQuery,
    OrganizationAudienceSortBy,
    OrganizationAudienceSortOrder
  } from '$features/org/utils/types';

  interface Props {
    query: OrganizationAudienceQuery;
    // Sort arrives as discrete props rather than being read off `query`, because
    // SortPopover binds them and binding into a prop object's field would make
    // the popover the owner of state the URL is supposed to own.
    sortBy: OrganizationAudienceSortBy;
    sortOrder: OrganizationAudienceSortOrder;
    activeFilterCount: number;
    isFiltering?: boolean;
    onFilterChange: (patch: Partial<OrganizationAudienceQuery>) => void;
    onClearFilters: () => void;
    onSortChange: (sortBy: OrganizationAudienceSortBy, sortOrder: OrganizationAudienceSortOrder) => void;
  }

  let {
    query,
    sortBy,
    sortOrder,
    activeFilterCount,
    isFiltering = false,
    onFilterChange,
    onClearFilters,
    onSortChange
  }: Props = $props();

  const sortOptions = $derived([
    { label: $t('audience.date_joined'), value: 'createdAt' },
    { label: $t('audience.name'), value: 'name' },
    { label: $t('audience.email'), value: 'email' },
    { label: $t('audience.filter.last_login'), value: 'lastLoginAt' },
    { label: $t('audience.filter.last_activity'), value: 'lastActiveAt' }
  ]);

  const statusOptions = $derived<{ value: OrganizationAudienceMemberStatus; label: string }[]>([
    { value: 'ACTIVE', label: $t('audience.filter.status_active') },
    { value: 'DEACTIVATED', label: $t('audience.filter.status_deactivated') },
    { value: 'ARCHIVED', label: $t('audience.filter.status_archived') }
  ]);

  // Staleness thresholds, phrased as the admin reads them: "hasn't been seen in
  // 90 days", not "seen within 90 days".
  const activityWindows = $derived<{ value: OrganizationAudienceActivityWindow; label: string }[]>([
    { value: '7d', label: $t('audience.filter.window_7d') },
    { value: '30d', label: $t('audience.filter.window_30d') },
    { value: '90d', label: $t('audience.filter.window_90d') },
    { value: '180d', label: $t('audience.filter.window_180d') },
    { value: 'never', label: $t('audience.filter.window_never') }
  ]);

  // Invite state is independent of membership state: someone can be archived
  // and still hold a pending invite.
  const inviteStatusOptions = $derived<{ value: OrganizationAudienceInviteStatus; label: string }[]>([
    { value: 'active', label: $t('audience.status_active') },
    { value: 'pending', label: $t('audience.status_pending') },
    { value: 'expired', label: $t('audience.status_expired') },
    { value: 'revoked', label: $t('audience.status_revoked') }
  ]);

  const enrollmentOptions = $derived<{ value: OrganizationAudienceEnrollment; label: string }[]>([
    { value: 'enrolled', label: $t('audience.filter.enrolled') },
    { value: 'not_enrolled', label: $t('audience.filter.not_enrolled') }
  ]);

  const completionOptions = $derived<{ value: OrganizationAudienceCompletion; label: string }[]>([
    { value: 'not_started', label: $t('audience.filter.not_started') },
    { value: 'in_progress', label: $t('audience.filter.in_progress') },
    { value: 'completed', label: $t('audience.filter.completed') }
  ]);

  const showsRecentJoinerToggle = $derived(Boolean(query.lastLoginBefore || query.lastActiveBefore));

  let localSortKey = $state(sortBy);
  let localSortOrder = $state(sortOrder);

  // The URL owns sort; this local copy exists only because SortPopover binds it.
  // Re-sync when a navigation lands with different sort params.
  $effect(() => {
    localSortKey = sortBy;
    localSortOrder = sortOrder;
  });

  /** Selecting the value that is already active clears it, so every row is a toggle. */
  function toggle<K extends keyof OrganizationAudienceQuery>(key: K, value: OrganizationAudienceQuery[K]) {
    onFilterChange({ [key]: query[key] === value ? undefined : value } as Partial<OrganizationAudienceQuery>);
  }
</script>

<SortPopover
  {sortOptions}
  bind:sortKey={localSortKey}
  bind:selectedOrder={localSortOrder}
  defaultSortKey="createdAt"
  defaultSortOrder="desc"
  {isFiltering}
  hasActiveFilters={activeFilterCount > 0}
  onSortKeyChange={(key) => onSortChange(key as OrganizationAudienceSortBy, localSortOrder)}
  onOrderChange={(order) => onSortChange(localSortKey, order)}
  {onClearFilters}
>
  {#snippet additionalContent()}
    <div class="space-y-4">
      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">{$t('audience.filter.status')}</p>
        <div class="flex flex-wrap gap-2">
          {#each statusOptions as option (option.value)}
            <Button
              type="button"
              size="sm"
              variant={query.status === option.value ? 'secondary' : 'outline'}
              onclick={() => onFilterChange({ status: option.value })}
            >
              {option.label}
            </Button>
          {/each}
        </div>
      </div>

      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">
          {$t('audience.filter.no_login_since')}
        </p>
        <div class="flex flex-wrap gap-2">
          {#each activityWindows as option (option.value)}
            <Button
              type="button"
              size="sm"
              variant={query.lastLoginBefore === option.value ? 'secondary' : 'outline'}
              onclick={() => toggle('lastLoginBefore', option.value)}
            >
              {option.label}
            </Button>
          {/each}
        </div>
      </div>

      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">
          {$t('audience.filter.no_activity_since')}
        </p>
        <div class="flex flex-wrap gap-2">
          {#each activityWindows as option (option.value)}
            <Button
              type="button"
              size="sm"
              variant={query.lastActiveBefore === option.value ? 'secondary' : 'outline'}
              onclick={() => toggle('lastActiveBefore', option.value)}
            >
              {option.label}
            </Button>
          {/each}
        </div>
      </div>

      {#if showsRecentJoinerToggle}
        <label class="ui:hover:bg-muted/30 flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2">
          <Checkbox
            checked={query.excludeRecentJoiners}
            onCheckedChange={(checked) => onFilterChange({ excludeRecentJoiners: Boolean(checked) })}
          />
          <span class="space-y-0.5">
            <span class="block text-sm">{$t('audience.filter.exclude_recent_joiners')}</span>
            <span class="ui:text-muted-foreground block text-xs">
              {$t('audience.filter.exclude_recent_joiners_hint')}
            </span>
          </span>
        </label>
      {/if}

      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">
          {$t('audience.filter.invite_status')}
        </p>
        <div class="flex flex-wrap gap-2">
          {#each inviteStatusOptions as option (option.value)}
            <Button
              type="button"
              size="sm"
              variant={query.inviteStatus === option.value ? 'secondary' : 'outline'}
              onclick={() => toggle('inviteStatus', option.value)}
            >
              {option.label}
            </Button>
          {/each}
        </div>
      </div>

      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">{$t('audience.filter.enrollment')}</p>
        <div class="flex flex-wrap gap-2">
          {#each enrollmentOptions as option (option.value)}
            <Button
              type="button"
              size="sm"
              variant={query.enrollment === option.value ? 'secondary' : 'outline'}
              onclick={() => toggle('enrollment', option.value)}
            >
              {option.label}
            </Button>
          {/each}
        </div>
      </div>

      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">{$t('audience.filter.completion')}</p>
        <div class="flex flex-wrap gap-2">
          {#each completionOptions as option (option.value)}
            <Button
              type="button"
              size="sm"
              variant={query.completion === option.value ? 'secondary' : 'outline'}
              onclick={() => toggle('completion', option.value)}
            >
              {option.label}
            </Button>
          {/each}
        </div>
      </div>
    </div>
  {/snippet}
</SortPopover>
