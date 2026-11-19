<script lang="ts">
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';
  import MathSettingsFields from '../math/math-settings-fields.svelte';
  import VariablesSection from '../math/variables-section.svelte';

  let { question, disabled = false, labels, onQuestionChange = () => {} }: ExerciseQuestionRendererProps = $props();

  function patchSettings(patch: Record<string, unknown>) {
    onQuestionChange({ ...question, settings: { ...(question.settings ?? {}), ...patch } });
  }
</script>

<MathSettingsFields settings={question.settings} {labels} {disabled} onPatchSettings={patchSettings}>
  {#snippet more()}
    <VariablesSection {question} {labels} {disabled} onPatchSettings={patchSettings} />
  {/snippet}
</MathSettingsFields>
