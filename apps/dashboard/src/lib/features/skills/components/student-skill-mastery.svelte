<script lang="ts">
  import { skillsApi } from '$features/skills/api';
  import { MASTERY_LEVEL_CLASS, type StudentSkillMastery } from '$features/skills/utils';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    courseId: string;
    profileId: string;
  }

  let { courseId, profileId }: Props = $props();

  let mastery = $state<StudentSkillMastery[]>([]);

  $effect(() => {
    const currentCourseId = courseId;
    const currentProfileId = profileId;

    void skillsApi.getStudentMastery(currentCourseId, currentProfileId).then((result) => {
      mastery = result;
    });
  });
</script>

{#if mastery.length > 0}
  <div class="mb-4 rounded-md border p-4" data-testid="student-skill-mastery">
    <p class="mb-2 text-sm font-medium">{$t('skills.mastery.student_heading')}</p>
    <ul class="flex flex-wrap gap-2">
      {#each mastery as skill (skill.skillId)}
        <li
          class={cn('rounded-md px-2 py-1 text-xs', MASTERY_LEVEL_CLASS[skill.level])}
          title={skill.name}
          data-testid="student-skill-mastery-item"
        >
          <span class="font-mono">{skill.code}</span>
          · {$t(`skills.mastery.level.${skill.level}`)}{skill.score === null ? '' : ` · ${Math.round(skill.score)}%`}
        </li>
      {/each}
    </ul>
  </div>
{/if}
