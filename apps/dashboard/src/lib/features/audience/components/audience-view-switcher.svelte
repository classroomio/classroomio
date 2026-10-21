<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { Button } from '@cio/ui/base/button';
  import { ORG_AUDIENCE_VIEWS } from '$features/org/utils/audience-query-utils';
  import { t } from '$lib/utils/functions/translations';
  import type { OrganizationAudienceView } from '$features/org/utils/types';

  interface Props {
    /** `null` when the active filters do not match any saved view exactly. */
    activeView: OrganizationAudienceView | null;
    onSelectView: (view: OrganizationAudienceView) => void;
  }

  let { activeView, onSelectView }: Props = $props();

  const viewLabels = $derived<Record<OrganizationAudienceView, string>>({
    all: $t('audience.views.all'),
    never_logged_in: $t('audience.views.never_logged_in'),
    inactive_90d: $t('audience.views.inactive_90d'),
    inactive_180d: $t('audience.views.inactive_180d'),
    enrolled_not_started: $t('audience.views.enrolled_not_started'),
    archived: $t('audience.views.archived')
  });

  const triggerLabel = $derived(activeView ? viewLabels[activeView] : $t('audience.views.custom'));
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" size="sm" testId="audience-view-switcher" class="gap-1 font-medium">
        {triggerLabel}
        <ChevronDownIcon class="size-4" aria-hidden="true" />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="start" class="w-56">
    {#each ORG_AUDIENCE_VIEWS as view (view)}
      <DropdownMenu.Item onSelect={() => onSelectView(view)}>
        <span class="flex-1">{viewLabels[view]}</span>
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
