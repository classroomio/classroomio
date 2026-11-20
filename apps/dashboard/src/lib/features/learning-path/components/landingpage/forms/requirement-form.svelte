<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import type { TLandingPage } from '@cio/utils/validation/learning-path';
  import { RichTextSectionForm } from '$features/ui';

  interface Props {
    landingPage: TLandingPage;
    onChange: (patch: Partial<TLandingPage>) => void;
  }

  let { landingPage, onChange }: Props = $props();

  let requirements = $derived(landingPage.requirements ?? '');
  let show = $derived(landingPage.showRequirements ?? true);
</script>

<RichTextSectionForm
  title={$t('learningPath.landing.requirement.title')}
  content={requirements}
  {show}
  onChange={(content) => onChange({ requirements: content })}
  onToggleShow={(checked) => onChange({ showRequirements: checked })}
/>
