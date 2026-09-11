<script lang="ts">
  import pluralize from 'pluralize';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import { Badge } from '@cio/ui/base/badge';
  import { t } from '$lib/utils/functions/translations';
  import type { Cohort } from '../utils/types';

  interface Props {
    cohort: Cohort;
    isLMS?: boolean;
    href?: string;
  }

  let { cohort, isLMS = false, href }: Props = $props();

  const courseCount = $derived(cohort.courseCount ?? 0);
  const studentCount = $derived(cohort.studentCount ?? 0);

  function handleRowClick() {
    if (href) {
      goto(resolve(href, {}));
      return;
    }

    const nextRoute = isLMS ? `/cohorts/${cohort.id}/newsfeed?source=lms` : `/cohorts/${cohort.id}/newsfeed`;

    goto(resolve(nextRoute, {}));
  }

  function getStatusVariant(status: Cohort['status']) {
    if (status === 'ACTIVE') {
      return 'success';
    }

    if (status === 'INACTIVE') {
      return 'secondary';
    }

    return 'outline';
  }

  function getStatusLabelKey(status: Cohort['status']) {
    if (status === 'ACTIVE') {
      return 'cohorts.status.active';
    }

    if (status === 'INACTIVE') {
      return 'cohorts.status.inactive';
    }

    return 'cohorts.status.archived';
  }
</script>

<ResourceListRow.Root variant="default" align="start" class="cursor-pointer py-3" onclick={handleRowClick} role="row">
  <div class="flex w-full items-start gap-6">
    <div class="min-w-0 flex-1">
      <p class="w-full truncate text-base font-semibold">{cohort.name}</p>

      {#if cohort.description}
        <p class="ui:text-muted-foreground mt-1 text-sm">{cohort.description}</p>
      {/if}
    </div>

    <div class="flex shrink-0 items-start">
      <Badge variant={getStatusVariant(cohort.status)}>
        {$t(getStatusLabelKey(cohort.status))}
      </Badge>
    </div>

    <div class="flex shrink-0 flex-col items-start gap-1">
      <p class="ui:text-muted-foreground text-sm">
        {pluralize(t.get('cohorts.card.courses'), courseCount, true)}
      </p>

      {#if !isLMS}
        <p class="ui:text-muted-foreground text-sm">
          {pluralize(t.get('cohorts.card.students'), studentCount, true)}
        </p>
      {/if}
    </div>
  </div>
</ResourceListRow.Root>
