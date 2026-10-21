<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Button } from '@cio/ui/base/button';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

  import { t } from '$lib/utils/functions/translations';
  import { COHORT_PEOPLE_VIEWS } from '$features/cohort/utils/people-query-utils';
  import type { CohortPeopleView } from '$features/cohort/utils/types';

  interface Props {
    activeView: CohortPeopleView | null;
    onSelectView: (view: CohortPeopleView) => void;
  }

  let { activeView, onSelectView }: Props = $props();

  const viewLabels: Record<CohortPeopleView, string> = $derived({
    all: $t('cohorts.people.views.all'),
    tutors: $t('cohorts.people.views.tutors'),
    students: $t('cohorts.people.views.students'),
    pending_invites: $t('cohorts.people.views.pending_invites'),
    never_logged_in: $t('cohorts.people.views.never_logged_in')
  });

  const triggerLabel = $derived(activeView ? viewLabels[activeView] : $t('course.navItem.people.views.custom'));
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" size="sm" testId="cohort-people-view-switcher" class="gap-1 font-medium">
        {triggerLabel}
        <ChevronDownIcon class="size-4" aria-hidden="true" />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content align="start">
    {#each COHORT_PEOPLE_VIEWS as view (view)}
      <DropdownMenu.Item onSelect={() => onSelectView(view)}>
        <span class="flex-1">{viewLabels[view]}</span>
        {#if activeView === view}
          <CheckIcon class="size-4" aria-hidden="true" />
        {/if}
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
