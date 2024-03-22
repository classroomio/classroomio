<script lang="ts">
  import { lesson } from '$lib/components/Course/components/Lesson/store/lessons';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';

  export let selectedLanguage = '';
  export let lessonId = '';

  let translations = [];
  let selectedLanguageContent = '';

  async function fetchTranslations(selectedLanguage) {
    const { data, error } = await supabase
      .from('lesson_language')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('lang', selectedLanguage);

    if (data) {
      translations = data;
      translations.map((translation) => (selectedLanguageContent = translation.content || ''));
      console.log('translation:', translations);
    }

    if (error) {
      console.error('Error fetching translations:', error.message);
      // Handle error appropriately (e.g., show error message to the user)
      return [];
    }
  }

  $: fetchTranslations(selectedLanguage);
</script>

{#if !isHtmlValueEmpty($lesson.materials?.note)}
  <HtmlRender className="m-auto">
    <svelte:fragment slot="content">
      <div>
        {@html selectedLanguageContent}
      </div>
    </svelte:fragment>
  </HtmlRender>
{/if}
