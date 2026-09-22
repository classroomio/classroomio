<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import type { LearningPathSeriesCourse } from '@cio/ui/custom/org-landing-page';
  import { LearningPathDetailAccent } from './index';

  interface Props {
    series: LearningPathSeriesCourse[];
  }

  let { series }: Props = $props();
</script>

{#if series.length > 0}
  <section class="mx-auto w-full max-w-4xl px-4 py-12 md:px-6">
    <h2 class="ui:text-foreground mb-6 text-2xl font-semibold">
      {t.get('public_learning_paths.detail.series_heading')}
    </h2>

    <div class="flex flex-col gap-6">
      {#each series as course (course.id)}
        <article class="ui:bg-card ui:border-border rounded-lg border p-6">
          <div class="flex flex-col gap-4">
            <div>
              <h3 class="ui:text-foreground text-lg font-semibold">{course.title}</h3>

              <p class="ui:text-muted-foreground mt-1 text-sm">{course.description}</p>
            </div>

            <ul class="flex flex-col gap-2">
              {#each course.lessonOutlines as lesson (lesson.id)}
                <li class="flex items-center gap-3 text-sm">
                  <LearningPathDetailAccent
                    gated={!!lesson.gated}
                    label={lesson.gated
                      ? t.get('public_learning_paths.detail.locked_label')
                      : t.get('public_learning_paths.detail.unlocked_label')}
                  />

                  <span class="ui:text-foreground">{lesson.title}</span>
                  <span class="ui:text-muted-foreground ml-auto shrink-0 tabular-nums">{lesson.durationMinutes}m</span>
                </li>
              {/each}
            </ul>
          </div>
        </article>
      {/each}
    </div>
  </section>
{/if}
