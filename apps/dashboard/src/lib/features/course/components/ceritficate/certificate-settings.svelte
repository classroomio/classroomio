<script lang="ts">
  import { Switch } from '@cio/ui/base/switch';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import * as Field from '@cio/ui/base/field';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi } from '$features/course/api';
  import { isFreePlan } from '$lib/utils/store/org';
  import { getOrderedNavigableContent } from '$features/course/utils/content';
  import { ContentType } from '@cio/utils/constants/content';

  type Props = {
    errors: Record<string, string>;
  };

  let { errors }: Props = $props();

  function isoToDatetimeLocal(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function updateCertificate(patch: Partial<NonNullable<typeof courseApi.course>['certificate']>) {
    if (!courseApi.course) return;

    courseApi.course.certificate = {
      ...(courseApi.course.certificate ?? {}),
      ...patch
    };
  }

  function onCertDeadlineChange(e: Event) {
    const v = (e.currentTarget as HTMLInputElement).value;
    updateCertificate({ deadline: v ? new Date(v).toISOString() : null });
  }

  const certExercises = $derived(
    getOrderedNavigableContent(courseApi.course).filter((item) => item.type === ContentType.Exercise)
  );

  const finalExerciseSelectValue = $derived(courseApi.course?.certificate?.requiredExerciseId ?? 'none');

  function onFinalExerciseChange(e: Event) {
    const v = (e.currentTarget as HTMLSelectElement).value;
    if (!v || v === 'none') {
      updateCertificate({ requiredExerciseId: null, exerciseMinScorePercent: null });
      return;
    }

    const currentMin = courseApi.course?.certificate?.exerciseMinScorePercent;
    updateCertificate({
      requiredExerciseId: v,
      exerciseMinScorePercent: currentMin ?? 100
    });
  }

  function onThresholdInput(e: Event) {
    const n = Number((e.currentTarget as HTMLInputElement).value);
    updateCertificate({ threshold: Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 100 });
  }

  function onMinExerciseScoreInput(e: Event) {
    const n = Number((e.currentTarget as HTMLInputElement).value);
    updateCertificate({ exerciseMinScorePercent: Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 100 });
  }

  function onEmailMessageInput(e: Event) {
    updateCertificate({ emailMessage: (e.currentTarget as HTMLTextAreaElement).value || null });
  }
</script>

<Field.Group class="w-full max-w-md! px-2">
  <Field.Set>
    <Field.Legend>{$t('course.certification.rules_heading')}</Field.Legend>

    <Field.Field orientation="horizontal">
      <Switch
        id="certificate-downloadable"
        checked={!!courseApi.course?.certificate?.isDownloadable}
        onCheckedChange={(checked) => {
          updateCertificate({ isDownloadable: checked });
        }}
        disabled={$isFreePlan}
      />
      <Field.Label for="certificate-downloadable" class="text-gray-600">
        {$t('course.navItem.certificates.allow')}
      </Field.Label>
    </Field.Field>

    <Field.Group>
      <Field.Field>
        <Field.Label for="cert-deadline">{$t('course.certification.deadline_label')}</Field.Label>
        <Input
          id="cert-deadline"
          type="datetime-local"
          class="w-full"
          value={isoToDatetimeLocal(courseApi.course?.certificate?.deadline ?? null)}
          onchange={onCertDeadlineChange}
          disabled={$isFreePlan}
        />
        <Field.Description>{$t('course.certification.deadline_helper')}</Field.Description>
        {#if errors['certificate.deadline']}
          <Field.Error>{errors['certificate.deadline']}</Field.Error>
        {/if}
      </Field.Field>

      <Field.Field>
        <Field.Label for="cert-threshold">{$t('course.certification.threshold_label')}</Field.Label>
        <Input
          id="cert-threshold"
          type="number"
          min={0}
          max={100}
          class="w-full"
          value={String(courseApi.course?.certificate?.threshold ?? 100)}
          oninput={onThresholdInput}
          disabled={$isFreePlan}
        />
        <Field.Description>{$t('course.certification.threshold_helper')}</Field.Description>
        {#if errors['certificate.threshold']}
          <Field.Error>{errors['certificate.threshold']}</Field.Error>
        {/if}
      </Field.Field>

      <Field.Field>
        <Field.Label for="cert-final-exercise">{$t('course.certification.final_exercise_label')}</Field.Label>
        <select
          id="cert-final-exercise"
          class="ui:border-input ui:bg-background ui:text-foreground ui:ring-offset-background ui:shadow-xs ui:flex ui:h-9 ui:w-full ui:min-w-0 ui:rounded-md ui:border ui:px-3 ui:py-1 ui:text-base ui:outline-none ui:transition-[color,box-shadow] ui:disabled:cursor-not-allowed ui:disabled:opacity-50 ui:md:text-sm ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:focus-visible:ring-[3px]"
          value={finalExerciseSelectValue}
          onchange={onFinalExerciseChange}
          disabled={$isFreePlan}
        >
          <option value="none">{$t('course.certification.final_exercise_none')}</option>
          {#each certExercises as item (item.id)}
            <option value={item.id}>{item.title}</option>
          {/each}
        </select>
        <Field.Description>{$t('course.certification.final_exercise_helper')}</Field.Description>
      </Field.Field>

      {#if courseApi.course?.certificate?.requiredExerciseId}
        <Field.Field>
          <Field.Label for="cert-min-exercise-score">{$t('course.certification.min_exercise_score_label')}</Field.Label>
          <Input
            id="cert-min-exercise-score"
            type="number"
            min={0}
            max={100}
            class="w-full"
            value={String(courseApi.course?.certificate?.exerciseMinScorePercent ?? 100)}
            oninput={onMinExerciseScoreInput}
            disabled={$isFreePlan}
          />
          <Field.Description>{$t('course.certification.min_exercise_score_helper')}</Field.Description>
          {#if errors['certificate.exerciseMinScorePercent']}
            <Field.Error>{errors['certificate.exerciseMinScorePercent']}</Field.Error>
          {/if}
        </Field.Field>
      {/if}
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.certification.email_message_label')}</Field.Legend>
    <Field.Field>
      <Textarea
        id="cert-email-message"
        class="w-full"
        rows={4}
        placeholder={$t('course.certification.email_message_placeholder')}
        value={courseApi.course?.certificate?.emailMessage ?? ''}
        oninput={onEmailMessageInput}
        disabled={$isFreePlan}
      />
      {#if errors['certificate.emailMessage']}
        <Field.Error>{errors['certificate.emailMessage']}</Field.Error>
      {/if}
    </Field.Field>
  </Field.Set>
</Field.Group>
