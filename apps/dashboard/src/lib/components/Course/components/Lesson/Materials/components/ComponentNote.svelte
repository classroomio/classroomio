<script lang="ts">
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import type { LOCALE } from '$lib/utils/types';
  import { lesson } from '$lib/components/Course/components/Lesson/store/lessons';

  export let noteByLocale: Record<LOCALE, string>;

  $: content = noteByLocale && noteByLocale[$lesson.locale];
  $: console.log({ locale: $lesson.locale, content, noteByLocale });
</script>

{#if !isHtmlValueEmpty(content)}
  <HtmlRender className="m-auto">
    <svelte:fragment slot="content">
      <div>
        {@html content}
      </div>
    </svelte:fragment>
  </HtmlRender>
{/if}
