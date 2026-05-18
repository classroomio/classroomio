<script lang="ts">
  import get from 'lodash/get';
  import { Label } from '@cio/ui/base/label';
  import { Switch } from '@cio/ui/base/switch';
  import AIGenerateButton from '$features/agent/components/ai-generate-button.svelte';

  import type { Course } from '$features/course/utils/types';
  import { NAV_ITEM_KEY } from '../../constants';
  import { t } from '$lib/utils/functions/translations';

  import { TextEditor } from '$features/ui';

  interface Props {
    course: Course;
    setter: (value: any, key: string) => void;
  }

  let { course = $bindable(), setter }: Props = $props();

  let show = $derived(get(course, `metadata.sectionDisplay.${NAV_ITEM_KEY.GOALS}`) ?? true);

  $effect(() => {
    setter(show, `metadata.sectionDisplay.${NAV_ITEM_KEY.GOALS}`);
  });
</script>

<div>
  <div class="mb-2 flex items-center justify-between">
    <span class="ui:text-sm ui:font-medium">{$t('course.navItem.landing_page.editor.title.goals')}</span>
    <AIGenerateButton
      courseId={course.id}
      format="html"
      context={`the "what you'll learn" goals section on the landing page${course.title ? ` for a course called "${course.title}"` : ''}`}
      onInsert={(text) => setter(text, 'metadata.goals')}
    />
  </div>
  <TextEditor content={course.metadata.goals} onChange={(content) => setter(content, `metadata.goals`)} />
</div>

<div class="mt-5 flex flex-col gap-2">
  <p class="font-semibold">
    {$t('course.navItem.landing_page.editor.display_section')}
  </p>

  <div class="flex items-center space-x-2">
    <Switch bind:checked={show} />

    <Label class="text-gray-600">
      {show ? $t('settings.landing_page.show_section') : $t('settings.landing_page.hide_section')}
    </Label>
  </div>
</div>
