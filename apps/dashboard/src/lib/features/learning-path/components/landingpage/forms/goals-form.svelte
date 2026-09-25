<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import type { TLandingPage } from '@cio/utils/validation/learning-path';
  import { RichTextSectionForm } from '$features/ui';

  interface Props {
    landingPage: TLandingPage;
    onChange: (patch: Partial<TLandingPage>) => void;
  }

  let { landingPage, onChange }: Props = $props();

  let goals = $derived(typeof landingPage.goals === 'string' ? landingPage.goals : '');
  let show = $derived(landingPage.showGoals ?? true);
</script>

<RichTextSectionForm
  title={$t('learningPath.landing.goals.title')}
  content={goals}
  {show}
  onChange={(content) => onChange({ goals: content })}
  onToggleShow={(checked) => onChange({ showGoals: checked })}
/>
