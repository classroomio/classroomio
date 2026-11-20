<script lang="ts">
  import { SKILL_MASTERY_LEVELS } from '@cio/question-types/skill-mastery';

  import { Button } from '@cio/ui/base/button';
  import { AssignPracticeDialog } from '$features/practice/components';
  import { skillsApi } from '$features/skills/api';
  import { MASTERY_LEVEL_CLASS, type ExerciseMastery } from '$features/skills/utils';
  import { cn } from '@cio/ui/tools';
  import { UpgradeBanner } from '$features/ui';
  import { isFreePlan } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    courseId: string;
    exerciseId: string;
  }

  let { courseId, exerciseId }: Props = $props();

  let mastery = $state<ExerciseMastery | null>(null);
  let practiceSkill = $state<{ id: string; code: string; students: { profileId: string; name: string }[] } | null>(null);
  let isPracticeOpen = $state(false);

  function weakStudents(skillId: string) {
    return (mastery?.students ?? [])
      .filter((student) => student.mastery[skillId]?.level === 'learning')
      .map((student) => ({ profileId: student.profileId, name: student.name ?? '' }));
  }

  function openPractice(skill: { id: string; code: string }) {
    practiceSkill = { id: skill.id, code: skill.code, students: weakStudents(skill.id) };
    isPracticeOpen = true;
  }

  $effect(() => {
    const currentCourseId = courseId;
    const currentExerciseId = exerciseId;
    if ($isFreePlan) return;

    void skillsApi.getExerciseMastery(currentCourseId, currentExerciseId).then((result) => {
      mastery = result;
    });
  });
</script>

{#if $isFreePlan}
  <UpgradeBanner>{$t('upgrade.paid_math_feature')}</UpgradeBanner>
{:else if mastery && mastery.skills.length > 0}
  <div class="rounded-md border p-4" data-testid="exercise-skill-mastery">
    <p class="text-sm font-medium">{$t('skills.mastery.heading')}</p>
    <p class="ui:text-muted-foreground mb-3 text-xs">{$t('skills.mastery.description')}</p>

    <div class="space-y-3">
      {#each mastery.skills as skill (skill.id)}
        {@const levels = mastery.summary.find((row) => row.skillId === skill.id)?.levels}
        {@const total = levels ? SKILL_MASTERY_LEVELS.reduce((sum, level) => sum + levels[level], 0) : 0}
        <div data-testid="exercise-skill-mastery-row">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm"><span class="font-mono text-xs">{skill.code}</span> · {skill.name}</p>
            {#if weakStudents(skill.id).length > 0}
              <Button
                size="sm"
                variant="outline"
                onclick={() => openPractice(skill)}
                testId="mastery-assign-practice"
              >
                {$t('practice.actions.assign_to_weak', { count: weakStudents(skill.id).length })}
              </Button>
            {/if}
          </div>
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

{#if practiceSkill}
  <AssignPracticeDialog
    bind:open={isPracticeOpen}
    {courseId}
    students={practiceSkill.students}
    source={{ skillId: practiceSkill.id }}
    defaultTitle={$t('practice.default_title', { name: practiceSkill.code })}
  />
{/if}
