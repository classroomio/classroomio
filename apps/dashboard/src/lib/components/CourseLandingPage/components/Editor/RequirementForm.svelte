<script lang="ts">
  import get from 'lodash/get';
  import { Label } from '@cio/ui/base/label';
  import { Switch } from '@cio/ui/base/switch';

  import type { Course } from '$lib/utils/types';
  import { NAV_ITEM_KEY } from '../../constants';
  import { t } from '$lib/utils/functions/translations';

  import TextEditor from '$lib/components/TextEditor/index.svelte';

  interface Props {
    course: Course;
    setter: (value: any, key: string) => void;
  }

  let { course = $bindable(), setter }: Props = $props();

  let show = $derived(get(course, `metadata.sectionDisplay.${NAV_ITEM_KEY.REQUIREMENT}`) ?? true);

  $effect(() => {
    setter(show, `metadata.sectionDisplay.${NAV_ITEM_KEY.REQUIREMENT}`);
  });
</script>

<div>
  <TextEditor content={course.metadata.requirements} onChange={(content) => setter(content, `metadata.requirements`)} />
</div>

<div class="mt-5">
  <p class="font-bold">
    {$t('course.navItem.landing_page.editor.display_section')}
  </p>

  <div class="flex items-center space-x-2">
    <Switch bind:checked={show} />

    <Label class="text-gray-600">
      {show ? $t('settings.landing_page.show_section') : $t('settings.landing_page.hide_section')}
    </Label>
  </div>
</div>
