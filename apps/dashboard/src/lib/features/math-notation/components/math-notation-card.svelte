<script lang="ts">
  import { DEFAULT_MATH_NOTATION, readMathNotationSettings, type MathNotationSettings } from '@cio/question-types';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Switch } from '@cio/ui/base/switch';
  import { SettingsCard } from '$features/ui';
  import { courseApi } from '$features/course/api';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { mathNotationApi } from '../api/math-notation.svelte';
  import MathNotationFields from './math-notation-fields.svelte';

  interface Props {
    courseId?: string;
  }

  let { courseId }: Props = $props();

  let fields = $state<MathNotationSettings>({ ...DEFAULT_MATH_NOTATION });
  let inheritFromOrg = $state(true);
  let loadedKey = '';

  const isCourse = $derived(Boolean(courseId));

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId) return;

    const key = `${organizationId}:${courseId ?? 'org'}`;
    if (key === loadedKey) return;

    loadedKey = key;
    void load();
  });

  async function load() {
    if (courseId) {
      await mathNotationApi.fetchCourseView(courseId);
      const view = mathNotationApi.courseView;
      if (!view) return;

      inheritFromOrg = view.override?.inheritFromOrg !== false;
      Object.assign(fields, inheritFromOrg ? view.org : view.effective);
      return;
    }

    await mathNotationApi.fetchOrgSettings();
    if (mathNotationApi.orgSettings) Object.assign(fields, readMathNotationSettings(mathNotationApi.orgSettings));
  }

  async function save() {
    if (courseId) {
      const override = inheritFromOrg ? { inheritFromOrg: true } : { ...fields, inheritFromOrg: false };
      await mathNotationApi.updateCourseOverride(courseId, override);
      if (mathNotationApi.success && courseApi.course) {
        courseApi.course.metadata = { ...courseApi.course.metadata, math: override };
      }
      return;
    }

    await mathNotationApi.updateOrgSettings({ ...fields });
    if (mathNotationApi.success) {
      $currentOrg.settings = { ...$currentOrg.settings, math: { ...fields } };
    }
  }
</script>

<SettingsCard
  id="math-notation"
  title={$t('mathNotation.title')}
  description={isCourse ? $t('mathNotation.course_description') : $t('mathNotation.org_description')}
>
  <Field.Group>
    {#if isCourse}
      <Field.Field orientation="horizontal">
        <Switch bind:checked={inheritFromOrg} data-testid="math-notation-inherit" />
        <Field.Label>{$t('mathNotation.inherit')}</Field.Label>
      </Field.Field>
    {/if}

    <MathNotationFields bind:value={fields} disabled={mathNotationApi.saving || (isCourse && inheritFromOrg)} />

    <div>
      <Button
        size="sm"
        onclick={save}
        disabled={mathNotationApi.saving || mathNotationApi.loading}
        testId="math-notation-save"
      >
        {$t('common.save_changes')}
      </Button>
    </div>
  </Field.Group>
</SettingsCard>
