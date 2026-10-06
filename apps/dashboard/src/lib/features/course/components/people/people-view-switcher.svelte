<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Button } from '@cio/ui/base/button';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

  import { t } from '$lib/utils/functions/translations';
  import { COURSE_PEOPLE_VIEWS } from '$features/course/utils/people-query-utils';
  import type { CoursePeopleView } from '$features/course/utils/types';

  interface Props {
    activeView: CoursePeopleView | null;
    onSelectView: (view: CoursePeopleView) => void;
  }

  let { activeView, onSelectView }: Props = $props();

  const viewLabels: Record<CoursePeopleView, string> = $derived({
    all: $t('course.navItem.people.views.all'),
    not_started: $t('course.navItem.people.views.not_started'),
    in_progress: $t('course.navItem.people.views.in_progress'),
    completed: $t('course.navItem.people.views.completed'),
    never_logged_in: $t('course.navItem.people.views.never_logged_in'),
    awaiting_certificate: $t('course.navItem.people.views.awaiting_certificate')
  });

  const triggerLabel = $derived(activeView ? viewLabels[activeView] : $t('course.navItem.people.views.custom'));
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" size="sm" testId="course-people-view-switcher" class="gap-1 font-medium">
        {triggerLabel}
        <ChevronDownIcon class="size-4" aria-hidden="true" />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content align="start">
    {#each COURSE_PEOPLE_VIEWS as view (view)}
      <DropdownMenu.Item onSelect={() => onSelectView(view)}>
        <span class="flex-1">{viewLabels[view]}</span>
        {#if activeView === view}
          <CheckIcon class="size-4" aria-hidden="true" />
        {/if}
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
