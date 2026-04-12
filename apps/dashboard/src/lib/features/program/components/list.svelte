<script lang="ts">
  import pluralize from 'pluralize';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import { Badge } from '@cio/ui/base/badge';
  import { t } from '$lib/utils/functions/translations';
  import type { Program } from '../utils/types';

  interface Props {
    program: Program;
    isLMS?: boolean;
    href?: string;
  }

  let { program, isLMS = false, href }: Props = $props();

  const courseCount = $derived(program.courseCount ?? 0);
  const studentCount = $derived(program.studentCount ?? 0);

  function handleRowClick() {
    if (href) {
      goto(resolve(href, {}));
      return;
    }

    const nextRoute = isLMS ? `/programs/${program.id}/newsfeed?source=lms` : `/programs/${program.id}/newsfeed`;

    goto(resolve(nextRoute, {}));
  }

  function getStatusVariant(status: Program['status']) {
    if (status === 'ACTIVE') {
      return 'success';
    }

    if (status === 'INACTIVE') {
      return 'secondary';
    }

    return 'outline';
  }

  function getStatusLabelKey(status: Program['status']) {
    if (status === 'ACTIVE') {
      return 'programs.status.active';
    }

    if (status === 'INACTIVE') {
      return 'programs.status.inactive';
    }

    return 'programs.status.archived';
  }
</script>

<ResourceListRow.Root
  variant="default"
  align="start"
  class="ui:cursor-pointer ui:py-3"
  onclick={handleRowClick}
  role="row"
>
  <div class="ui:flex ui:w-full ui:items-start ui:gap-6">
    <div class="ui:min-w-0 ui:flex-1">
      <p class="ui:w-full ui:truncate ui:text-base ui:font-semibold">{program.name}</p>

      {#if program.description}
        <p class="ui:mt-1 ui:text-sm ui:text-muted-foreground">{program.description}</p>
      {/if}
    </div>

    <div class="ui:flex ui:shrink-0 ui:items-start">
      <Badge variant={getStatusVariant(program.status)}>
        {$t(getStatusLabelKey(program.status))}
      </Badge>
    </div>

    <div class="ui:flex ui:shrink-0 ui:flex-col ui:items-start ui:gap-1">
      <p class="ui:text-sm ui:text-muted-foreground">
        {pluralize(t.get('programs.card.courses'), courseCount, true)}
      </p>

      {#if !isLMS}
        <p class="ui:text-sm ui:text-muted-foreground">
          {pluralize(t.get('programs.card.students'), studentCount, true)}
        </p>
      {/if}
    </div>
  </div>
</ResourceListRow.Root>
