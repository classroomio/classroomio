<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import type { TLandingPage } from '@cio/utils/validation/learning-path';
  import { RichTextSectionForm } from '$features/ui';

  interface Props {
    landingPage: TLandingPage;
    onChange: (patch: Partial<TLandingPage>) => void;
  }

  let { landingPage, onChange }: Props = $props();

  let description = $derived(landingPage.description ?? '');
  let show = $derived(landingPage.showDescription ?? true);
</script>

<RichTextSectionForm
  title={$t('learningPath.landing.description.title')}
  content={description}
  {show}
  onChange={(content) => onChange({ description: content })}
  onToggleShow={(checked) => onChange({ showDescription: checked })}
/>
