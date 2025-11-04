<script lang="ts">
  import get from 'lodash/get';
  import { Toggle } from 'carbon-components-svelte';
  import type { Course } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { NAV_ITEM_KEY } from '../../constants';
  import EdraEditor from '$lib/components/Edra/EdraRoot.svelte';

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
  <EdraEditor
    content={course.metadata.requirements}
    onContentChange={(content) => setter(content, `metadata.requirements`)}
  />
</div>

<div class="mt-5">
  <p class="font-bold">
    {$t('course.navItem.landing_page.editor.display_section')}
  </p>

  <Toggle bind:toggled={show} size="sm">
    <span slot="labelA" style="color: gray">{$t('settings.landing_page.hide_section')}</span>
    <span slot="labelB" style="color: gray">{$t('settings.landing_page.show_section')}</span>
  </Toggle>
</div>
