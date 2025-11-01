<script lang="ts">
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { handleOpenWidget } from '../../store';
  import { t } from '$lib/utils/functions/translations';

  let { course = $bindable() } = $props();

  function widgetControl() {
    $handleOpenWidget.open = !$handleOpenWidget.open;
  }
</script>

<TextField
  className="mt-5"
  labelClassName="font-bold"
  label={$t('course.navItem.landing_page.editor.header_form.title')}
  bind:value={course.title}
/>

<TextArea
  label={$t('course.navItem.landing_page.editor.header_form.description')}
  bind:value={course.description}
  rows={6}
  className="mt-5"
  labelClassName="font-bold"
/>

<TextField
  className="mt-5"
  labelClassName="font-bold"
  label={$t('course.navItem.landing_page.editor.header_form.short_video')}
  placeholder="www.youtube.com/watch?v=uYRq60G5XTk"
  helperMessage={$t('course.navItem.landing_page.editor.header_form.helper')}
  type="text"
  bind:value={course.metadata.videoUrl}
/>
<div class="mt-7">
  <p class="mb-3 font-bold">{$t('course.navItem.landing_page.editor.header_form.replace_cover')}</p>
  <PrimaryButton
    label={$t('course.navItem.landing_page.editor.header_form.replace')}
    variant={VARIANTS.OUTLINED}
    onClick={widgetControl}
  />
</div>
