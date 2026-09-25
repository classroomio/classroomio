<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import type { TLandingPage } from '@cio/utils/validation/learning-path';
  import { TagListInput } from '$features/ui';

  interface Props {
    landingPage: TLandingPage;
    onChange: (patch: Partial<TLandingPage>) => void;
  }

  let { landingPage, onChange }: Props = $props();

  let skills = $derived([...(landingPage.skills ?? [])]);

  function handleAddSkill(value: string) {
    const next = [...skills, value];
    onChange({ skills: next });
  }

  function handleRemoveSkill(skillToRemove: string) {
    onChange({ skills: skills.filter((skill) => skill !== skillToRemove) });
  }
</script>

<TagListInput
  title={$t('learningPath.landing.skills.title')}
  helpText={$t('learningPath.landing.skills.help')}
  placeholder={$t('learningPath.landing.skills.placeholder')}
  items={skills}
  onAdd={handleAddSkill}
  onRemove={handleRemoveSkill}
/>
