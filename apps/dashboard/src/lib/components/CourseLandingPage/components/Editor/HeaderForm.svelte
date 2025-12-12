<script lang="ts">
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Button } from '@cio/ui/base/button';
  import { handleOpenWidget } from '../../store';
  import { t } from '$lib/utils/functions/translations';

  let { course = $bindable() } = $props();

  function widgetControl() {
    $handleOpenWidget.open = !$handleOpenWidget.open;
  }
</script>

<InputField
  className="mt-5"
  labelClassName="font-bold"
  label={$t('course.navItem.landing_page.editor.header_form.title')}
  bind:value={course.title}
/>

<TextareaField
  label={$t('course.navItem.landing_page.editor.header_form.description')}
  bind:value={course.description}
  rows={6}
  className="mt-5"
  labelClassName="font-bold"
/>

<InputField
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
