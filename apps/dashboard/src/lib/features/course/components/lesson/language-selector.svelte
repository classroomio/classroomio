<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import { LANGUAGES } from '$lib/utils/constants/translation';
  import { lessonApi } from '$features/course/api';

  const currentLanguage = $derived(LANGUAGES.find((lang) => lang.id === lessonApi.currentLocale));
</script>

<Select.Root type="single" bind:value={lessonApi.currentLocale}>
  <Select.Trigger class="h-9 w-auto gap-1 px-2 sm:w-[120px]">
    <span class="sm:hidden">{lessonApi.currentLocale.toUpperCase()}</span>
    <span class="hidden sm:inline">{currentLanguage?.text ?? 'Language'}</span>
  </Select.Trigger>
  <Select.Content>
    <Select.Group>
      {#each LANGUAGES as lang (lang.id)}
        <Select.Item value={lang.id}>{lang.text}</Select.Item>
      {/each}
    </Select.Group>
  </Select.Content>
</Select.Root>
