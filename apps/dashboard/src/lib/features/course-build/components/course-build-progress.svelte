<script lang="ts">
  import { resolve } from '$app/paths';
  import { t } from '$lib/utils/functions/translations';
  import CheckIcon from '@lucide/svelte/icons/check';
  import LoaderIcon from '@lucide/svelte/icons/loader-circle';
  import XIcon from '@lucide/svelte/icons/x';

  import { courseProgress, planningStep, sourceKindKey, sourceLabel } from '../utils/course-build-utils';
  import type { CourseBuildSummary } from '../utils/types';

  interface Props {
    build: CourseBuildSummary;
    /** Links each ready course to its page; the onboarding screen leaves it out, since the workspace is not open yet. */
    links?: boolean;
  }

  let { build, links = false }: Props = $props();

  const visibleSources = $derived(build.sources.filter((source) => source.status !== 'FAILED' || source.pagesRead));
  const step = $derived(planningStep(build));
</script>

<div class="flex flex-col gap-6" data-testid="course-build-progress">
  {#if visibleSources.length}
    <section>
      <h3 class="ui:text-muted-foreground font-mono text-xs tracking-[0.12em] uppercase">
        {$t('course_build.sources_label')}
      </h3>
      <ul class="mt-2">
        {#each visibleSources as source (source.url)}
          <li class="flex items-center gap-3 border-t py-2.5 text-sm last:border-b">
            {#if source.status === 'READ'}
              <CheckIcon class="ui:text-primary custom size-4 shrink-0" aria-hidden="true" />
            {:else if source.status === 'FAILED'}
              <XIcon class="ui:text-muted-foreground custom size-4 shrink-0" aria-hidden="true" />
            {:else}
              <LoaderIcon class="ui:text-muted-foreground custom size-4 shrink-0 animate-spin" aria-hidden="true" />
            {/if}
            <span class="min-w-0 flex-1 truncate">
              <span class="font-medium">{$t(sourceKindKey(source.kind))}</span>
              <span class="ui:text-muted-foreground"> · {sourceLabel(source)}</span>
            </span>
            <span class="ui:text-muted-foreground shrink-0 tabular-nums">
              {#if source.status === 'FAILED'}
                {$t('course_build.source_status.failed')}
              {:else}
                {$t('course_build.source_pages', { count: String(source.pagesRead) })}
              {/if}
            </span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if step}
    <section data-testid="course-build-planning-step">
      <h3 class="ui:text-muted-foreground font-mono text-xs tracking-[0.12em] uppercase">
        {$t('course_build.courses_label')}
      </h3>
      <div class="mt-2 flex items-start gap-3 border-y py-2.5 text-sm">
        <LoaderIcon class="ui:text-muted-foreground custom mt-0.5 size-4 shrink-0 animate-spin" aria-hidden="true" />
        <div class="min-w-0 flex-1">
          <p class="font-medium">
            {#if step.key === 'course_build.planning_step.understand'}
              {$t(step.key, { count: String(step.pages) })}
            {:else}
              {$t(step.key)}
            {/if}
          </p>
          <p class="ui:text-muted-foreground mt-0.5">{$t('course_build.planning_step.hint')}</p>
        </div>
      </div>
    </section>
  {/if}

  {#if build.courses.length}
    <section>
      <h3 class="ui:text-muted-foreground font-mono text-xs tracking-[0.12em] uppercase">
        {$t('course_build.courses_label')}
      </h3>
      <ul class="mt-2">
        {#each build.courses as course (course.id)}
          {@const progress = courseProgress(course)}
          <li class="flex items-center gap-3 border-t py-2.5 text-sm last:border-b">
            <span class="min-w-0 flex-1 truncate font-medium">
              {#if course.courseId && links}
                <a class="ui:text-primary hover:underline" href={resolve('/courses/[id]', { id: course.courseId })}
                  >{course.title}</a
                >
              {:else}
                {course.title}
              {/if}
            </span>
            <span class="ui:text-muted-foreground shrink-0 tabular-nums">
              {#if progress.key === 'course_build.course_status.writing'}
                {$t(progress.key, { current: String(progress.current), total: String(progress.total) })}
              {:else}
                {$t(progress.key)}
              {/if}
            </span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>
