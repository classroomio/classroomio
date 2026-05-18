<script lang="ts">
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Button } from '@cio/ui/base/button';
  import AIGenerateButton from '$features/agent/components/ai-generate-button.svelte';
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
>
  {#snippet labelAction()}
    <AIGenerateButton
      courseId={course.id}
      context="the title field on the landing page for an online course"
      onInsert={(text) => (course.title = text)}
    />
  {/snippet}
</InputField>

<TextareaField
  label={$t('course.navItem.landing_page.editor.header_form.description')}
  bind:value={course.description}
  rows={6}
  className="mt-5"
  labelClassName="font-bold"
>
  {#snippet labelAction()}
    <AIGenerateButton
      courseId={course.id}
      context={`the short description on the landing page of a course${course.title ? ` called "${course.title}"` : ''}`}
      onInsert={(text) => (course.description = text)}
    />
  {/snippet}
</TextareaField>

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
