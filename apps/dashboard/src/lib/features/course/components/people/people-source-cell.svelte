<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import type { CourseMember } from '$features/course/utils/types';

  interface Props {
    member: CourseMember;
  }

  let { member }: Props = $props();

  /**
   * Label for the member's latest grant source, plus a deep link to the path or cohort
   * that granted it. Only org admins get the link, since tutors cannot open those pages.
   */
  const source = $derived.by(() => {
    if (member.enrollmentSource === 'LEARNING_PATH') {
      const pathPublicId = member.enrollmentSourcePathPublicId;
      const href = pathPublicId ? `/paths/${pathPublicId}` : null;

      return { labelKey: 'course.navItem.people.source_learning_path', href };
    }

    if (member.enrollmentSource === 'COHORT') {
      const cohortId = member.enrollmentSourceCohortId;
      const href = cohortId ? `/cohorts/${cohortId}/newsfeed` : null;

      return { labelKey: 'course.navItem.people.source_cohort', href };
    }

    return null;
  });

  const linkHref = $derived(source?.href && $isOrgAdmin ? source.href : null);
</script>

<Table.Cell class="min-w-[110px]">
  {#if !source}
    <span class="ui:text-muted-foreground text-sm">—</span>
  {:else if linkHref}
    <a href={linkHref} class="ui:text-primary text-sm font-medium hover:underline">
      <Badge variant="outline">{$t(source.labelKey)}</Badge>
    </a>
  {:else}
    <Badge variant="outline">{$t(source.labelKey)}</Badge>
  {/if}
</Table.Cell>
