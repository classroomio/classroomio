<script lang="ts">
  import { HTMLRender } from '$features/ui';
  import { sanitizeHtml } from '@cio/ui/tools/sanitize';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { lessonApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';

  let {
    lessonId
  }: {
    lessonId: string;
  } = $props();

  let hasAtLeastOneTranslation = $derived(
    Object.values(lessonApi.translations[lessonId] || {}).some((content) => {
      return content && !!content.length;
    })
  );
</script>

{#if !isHtmlValueEmpty(lessonApi.note)}
  <HTMLRender className="m-auto">
    <div>
      {@html sanitizeHtml(lessonApi.note)}
    </div>
  </HTMLRender>
{:else if hasAtLeastOneTranslation}
  <div class="flex flex-col items-center justify-center text-center">
    <h3 class="py-2 text-lg font-normal italic dark:text-white">
      {$t('course.navItem.lessons.materials.no_translation')}
    </h3>
  </div>
{/if}
