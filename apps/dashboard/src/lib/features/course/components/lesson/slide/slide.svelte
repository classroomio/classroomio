<script lang="ts">
  import { lessonApi } from '$features/course/api';
  import { InputField } from '@cio/ui/custom/input-field';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';

  interface Props {
    mode?: (typeof MODES)[keyof typeof MODES];
  }

  let { mode = MODES.view }: Props = $props();

  let url = $derived(getUrl(lessonApi.lesson?.slideUrl || ''));

  function canvaHandler(_url): string {
    if (_url.includes('?embed')) return _url;
    return `${_url}?embed`;
  }

  function getUrl(_url: string | null): string | undefined {
    if (!_url) return;
    if (_url.includes('www.canva.com')) {
      return canvaHandler(_url);
    }
    return _url;
  }
</script>

{#if mode === MODES.edit}
  <!-- Edit Mode -->
  {@const slideUrlValue = lessonApi.lesson?.slideUrl || ''}
  <InputField
    label={$t('course.navItem.lessons.materials.tabs.slide.slide_link')}
    value={slideUrlValue}
    onInputChange={(e) => {
      lessonApi.updateLessonState('slideUrl', e.currentTarget.value);
    }}
    helperMessage={$t('course.navItem.lessons.materials.tabs.slide.helper_message')}
  />
{:else}
  <!-- View Mode -->
  {#if url}
    <iframe
      title="Embeded Slides"
      src={url}
      frameborder="0"
      width="100%"
      height="569"
      class="iframe my-3"
      allowfullscreen={true}
    ></iframe>
  {/if}
{/if}
