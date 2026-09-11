<script lang="ts">
  import { resolve } from '$app/paths';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import { t } from '$lib/utils/functions/translations';
  import AnalyticsPanelCard from './analytics-panel-card.svelte';
  import type { TopCoursesData } from '../utils/types';

  interface Props {
    data: TopCoursesData;
    loading?: boolean;
  }

  let { data, loading = false }: Props = $props();

  const maxViews = $derived(Math.max(1, ...data.map((row) => row.views)));
</script>

<AnalyticsPanelCard
  title={$t('analytics.topCourses.heading')}
  description={data.length > 0 ? $t('analytics.topCourses.subtitle') : $t('analytics.topCourses.description')}
>
  {#if loading && data.length === 0}
    <div class="flex h-32 items-center justify-center">
      <Spinner class="ui:text-muted-foreground size-6" />
    </div>
  {:else if data.length === 0}
    <Empty icon={BookOpenIcon} title={$t('analytics.topCourses.empty')} />
  {:else}
    <div class="ui:text-muted-foreground mb-2 flex justify-between text-xs font-medium tracking-wide uppercase">
      <span>{$t('analytics.topCourses.course')}</span>
      <span>{$t('analytics.topCourses.views')}</span>
    </div>
    <ol class="ui:divide-border divide-y">
      {#each data as row, index (row.courseId)}
        {@const rank = index + 1}
        <li class="relative py-2.5">
          <div
            class="ui:bg-primary/10 absolute inset-y-1 left-0 rounded-r"
            style="width: {(row.views / maxViews) * 100}%"
            aria-hidden="true"
          ></div>
          <div class="relative flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <span class="ui:text-muted-foreground w-5 shrink-0 text-xs font-medium tabular-nums">
                {String(rank).padStart(2, '0')}
              </span>
              <a
                href={resolve(`/courses/${row.courseId}`, {})}
                class="ui:text-foreground line-clamp-1 text-sm font-medium hover:underline"
                title={row.title}
              >
                {row.title}
              </a>
            </div>
            <p class="ui:text-foreground shrink-0 text-sm font-semibold tabular-nums">
              {row.views.toLocaleString()}
            </p>
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</AnalyticsPanelCard>
