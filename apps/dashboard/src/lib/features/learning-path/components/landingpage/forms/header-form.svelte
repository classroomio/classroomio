<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { t } from '$lib/utils/functions/translations';
  import type { TLandingPage } from '@cio/utils/validation/learning-path';
  import type { LearningPathDetail } from '$features/learning-path/utils/types';

  interface Props {
    landingPage: TLandingPage;
    path: LearningPathDetail;
    onChange: (patch: Partial<TLandingPage>) => void;
  }

  let { landingPage, path, onChange }: Props = $props();

  let title = $state(landingPage.title ?? path.name ?? '');
  let description = $state(landingPage.description ?? path.description ?? '');

  $effect(() => {
    const nextTitle = landingPage.title ?? path.name ?? '';
    if (nextTitle !== title) title = nextTitle;
  });

  $effect(() => {
    const nextDesc = landingPage.description ?? path.description ?? '';
    if (nextDesc !== description) description = nextDesc;
  });

  function handleTitleInput(value: string) {
    title = value;
    onChange({ title: value });
  }

  function handleDescriptionInput(value: string) {
    description = value;
    onChange({ description: value });
  }
</script>

<Field.Group>
  <Field.Set>
    <Field.Group>
      <Field.Field>
        <InputField
          label={$t('learningPath.landing.header.title_label')}
          value={title}
          oninput={(e) => handleTitleInput((e.currentTarget as HTMLInputElement).value)}
          placeholder={path.name || $t('learningPath.landing.header.title_placeholder')}
        />
      </Field.Field>

      <Field.Field>
        <TextareaField
          label={$t('learningPath.landing.header.description_label')}
          value={description}
          oninput={(e) => handleDescriptionInput((e.currentTarget as HTMLTextAreaElement).value)}
          placeholder={path.description || $t('learningPath.landing.header.description_placeholder')}
          rows={5}
        />
      </Field.Field>
    </Field.Group>
  </Field.Set>
</Field.Group>
