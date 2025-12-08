<script lang="ts">
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { Button } from '@cio/ui/base/button';
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
  <p class="mb-3">{$t('course.navItem.landing_page.editor.header_form.replace_cover')}</p>
  <Button variant="outline" onclick={widgetControl}>
    {$t('course.navItem.landing_page.editor.header_form.replace')}
  </Button>
</div>
