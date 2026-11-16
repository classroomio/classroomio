<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { SKILL_MASTERY_LEVELS } from '@cio/question-types/skill-mastery';

  import { MASTERY_LEVEL_CLASS } from '$features/skills/utils';
  import type { PublicStudentReport } from '$features/student-report/utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    report: PublicStudentReport;
  }

  let { report }: Props = $props();

  const accentColor = $derived(report.organization.themeColor ?? '#1d4ed8');
  const periodLabel = $derived(`${report.periodStart.slice(0, 10)} – ${report.periodEnd.slice(0, 10)}`);

  function skillLevelLabel(level: string) {
    return SKILL_MASTERY_LEVELS.includes(level as (typeof SKILL_MASTERY_LEVELS)[number])
      ? $t(`skills.mastery.level.${level}`)
      : level;
  }
</script>

<article
  class="report-page mx-auto flex max-w-3xl flex-col gap-6 bg-white p-8 text-neutral-900"
  style={`--report-accent: ${accentColor}`}
  data-testid="student-report"
>
  <header class="flex items-center justify-between gap-4 border-b-4 pb-4" style="border-color: var(--report-accent)">
    <div class="flex items-center gap-3">
      {#if report.organization.logoUrl}
        <img src={report.organization.logoUrl} alt="" class="h-12 w-auto" data-testid="report-logo" />
      {/if}
      <span class="text-xl font-semibold" style="color: var(--report-accent)">{report.organization.name}</span>
    </div>
    <Button class="no-print" size="sm" variant="outline" onclick={() => window.print()} testId="report-print">
      {$t('student_report.view.print')}
    </Button>
  </header>

  <section>
    <h1 class="text-2xl font-semibold" data-testid="report-student-name">{report.studentName}</h1>
    <p class="text-sm text-neutral-600">{report.courseTitle} · {periodLabel}</p>
  </section>

  {#if report.teacherComment}
    <section class="rounded-md border-l-4 bg-neutral-50 p-4" style="border-color: var(--report-accent)">
      <h2 class="mb-1 text-sm font-semibold tracking-wide text-neutral-600 uppercase">
        {$t('student_report.view.comment')}
      </h2>
      <p class="text-sm whitespace-pre-wrap" data-testid="report-comment-text">{report.teacherComment}</p>
    </section>
  {/if}

  <section>
    <h2 class="mb-2 text-lg font-semibold">{$t('student_report.view.mastered')}</h2>
    {#if report.masteredSkills.length === 0}
      <p class="text-sm text-neutral-600">{$t('student_report.view.none_yet')}</p>
    {:else}
      <ul class="flex flex-col gap-1" data-testid="report-mastered">
        {#each report.masteredSkills as skill (skill.code)}
          <li class="flex items-center justify-between gap-2 text-sm">
            <span><span class="font-mono text-xs">{skill.code}</span> · {skill.name}</span>
            <span class={`rounded px-2 py-0.5 text-xs ${MASTERY_LEVEL_CLASS[skill.level]}`}
              >{skillLevelLabel(skill.level)}</span
            >
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section>
    <h2 class="mb-2 text-lg font-semibold">{$t('student_report.view.to_work_on')}</h2>
    {#if report.skillsToWorkOn.length === 0}
      <p class="text-sm text-neutral-600">{$t('student_report.view.none_yet')}</p>
    {:else}
      <ul class="flex flex-col gap-1" data-testid="report-to-work-on">
        {#each report.skillsToWorkOn as skill (skill.code)}
          <li class="flex items-center justify-between gap-2 text-sm">
            <span><span class="font-mono text-xs">{skill.code}</span> · {skill.name}</span>
            <span class={`rounded px-2 py-0.5 text-xs ${MASTERY_LEVEL_CLASS[skill.level]}`}>
              {skill.score === null ? skillLevelLabel(skill.level) : `${skill.score}%`}
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section>
    <h2 class="mb-2 text-lg font-semibold">{$t('student_report.view.scores')}</h2>
    {#if report.scores.length === 0}
      <p class="text-sm text-neutral-600">{$t('student_report.view.no_scores')}</p>
    {:else}
      <table class="w-full text-sm" data-testid="report-scores">
        <thead>
          <tr class="border-b text-left text-neutral-600">
            <th class="py-1 font-medium">{$t('student_report.view.exercise')}</th>
            <th class="py-1 text-right font-medium">{$t('student_report.view.score')}</th>
          </tr>
        </thead>
        <tbody>
          {#each report.scores as score (score.exerciseTitle + score.submittedAt)}
            <tr class="border-b">
              <td class="py-1">{score.exerciseTitle}</td>
              <td class="py-1 text-right">
                {score.score} / {score.maxScore}{score.percent === null ? '' : ` (${score.percent}%)`}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </section>

  <footer class="border-t pt-3 text-xs text-neutral-500">
    {$t('student_report.view.footer', { date: report.expiresAt.slice(0, 10) })}
  </footer>
</article>

<style>
  .report-page {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  @media print {
    :global(.no-print) {
      display: none !important;
    }

    :global(body) {
      background: white;
    }

    .report-page {
      max-width: none;
      padding: 0;
    }
  }

  @page {
    size: A4;
    margin: 14mm;
  }
</style>
