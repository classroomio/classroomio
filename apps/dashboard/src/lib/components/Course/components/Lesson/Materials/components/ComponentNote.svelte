<script lang="ts">
  import { lesson } from '$lib/components/Course/components/Lesson/store/lessons';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { onMount } from 'svelte';

  export let selectedLanguage = 'English';
  export let lessonId = '';

  let translations = [];
  let selectedLanguageContent;

  async function fetchTranslations(selectedLanguage) {
    const { data, error } = await supabase
      .from('lesson_language')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('lang', selectedLanguage);

    if (data) {
      translations = data;
      translations.map((translation) => (selectedLanguageContent = translation.content || ''));
    }

    if (error) {
      console.error('Error fetching translations:', error.message);
    }
  }

  onMount(() => {
    fetchTranslations(selectedLanguage);
  });

  $: {
    fetchTranslations(selectedLanguage);
  }
</script>

{#if !isHtmlValueEmpty(selectedLanguageContent)}
  <HtmlRender className="m-auto">
    <svelte:fragment slot="content">
      <div>
        {@html selectedLanguageContent}
      </div>
    </svelte:fragment>
  </HtmlRender>
{/if}
