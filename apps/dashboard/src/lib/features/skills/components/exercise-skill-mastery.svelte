<script lang="ts">
  import { SKILL_MASTERY_LEVELS } from '@cio/question-types/skill-mastery';

  import { skillsApi } from '$features/skills/api';
  import { MASTERY_LEVEL_CLASS, type ExerciseMastery } from '$features/skills/utils';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    courseId: string;
    exerciseId: string;
  }

  let { courseId, exerciseId }: Props = $props();

  let mastery = $state<ExerciseMastery | null>(null);

  $effect(() => {
    const currentCourseId = courseId;
    const currentExerciseId = exerciseId;

    void skillsApi.getExerciseMastery(currentCourseId, currentExerciseId).then((result) => {
      mastery = result;
    });
  });
</script>

{#if mastery && mastery.skills.length > 0}
  <div class="rounded-md border p-4" data-testid="exercise-skill-mastery">
    <p class="text-sm font-medium">{$t('skills.mastery.heading')}</p>
    <p class="ui:text-muted-foreground mb-3 text-xs">{$t('skills.mastery.description')}</p>

    <div class="space-y-3">
      {#each mastery.skills as skill (skill.id)}
        {@const levels = mastery.summary.find((row) => row.skillId === skill.id)?.levels}
        {@const total = levels ? SKILL_MASTERY_LEVELS.reduce((sum, level) => sum + levels[level], 0) : 0}
        <div data-testid="exercise-skill-mastery-row">
          <p class="text-sm"><span class="font-mono text-xs">{skill.code}</span> · {skill.name}</p>
          {#if levels && total > 0}
            <div class="mt-1 flex h-5 overflow-hidden rounded-md text-[11px]">
              {#each SKILL_MASTERY_LEVELS as level (level)}
                {#if levels[level] > 0}
                  <div
                    class={cn('flex items-center justify-center', MASTERY_LEVEL_CLASS[level])}
                    style={`width: ${(levels[level] / total) * 100}%`}
                    title={`${$t(`skills.mastery.level.${level}`)}: ${levels[level]}`}
                  >
                    {levels[level]}
                  </div>
                {/if}
              {/each}
            </div>
          {:else}
            <p class="ui:text-muted-foreground text-xs">{$t('skills.mastery.no_data')}</p>
          {/if}
        </div>
      {/each}
    </div>

    <div class="mt-3 flex flex-wrap gap-3 text-xs">
      {#each SKILL_MASTERY_LEVELS as level (level)}
        <span class="flex items-center gap-1">
          <span class={cn('inline-block size-3 rounded-sm border', MASTERY_LEVEL_CLASS[level])}></span>
          {$t(`skills.mastery.level.${level}`)}
        </span>
      {/each}
    </div>
  </div>
{/if}
