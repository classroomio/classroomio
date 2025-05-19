<script lang="ts">
  import cloneDeep from 'lodash/cloneDeep';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import set from 'lodash/set';
  import get from 'lodash/get';
  import isEmpty from 'lodash/isEmpty';
  import { Toggle } from 'carbon-components-svelte';
  import type { Course } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { NAV_ITEM_KEY } from '../../constants';

  export let course: Course;

  let show: boolean;
  let hasBeenSet = false;

  function setter(value: any, setterKey: string) {
    if (typeof value === 'undefined') return;

    const _course = cloneDeep(course);
    set(_course, setterKey, value);

    course = _course;
  }

  function setDefaults(course: Course) {
    if (isEmpty(course) || hasBeenSet) return;

    hasBeenSet = true;

    show = get(course, `metadata.sectionDisplay.${NAV_ITEM_KEY.GOALS}`) ?? true;
  }

  $: setter(show, `metadata.sectionDisplay.${NAV_ITEM_KEY.GOALS}`);
  $: setDefaults(course);
</script>

<div class="">
  <TextEditor bind:value={course.metadata.goals} />
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
