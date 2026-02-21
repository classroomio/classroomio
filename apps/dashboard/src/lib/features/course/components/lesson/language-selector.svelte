<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import { LANGUAGES } from '$lib/utils/constants/translation';
  import { lessonApi } from '$features/course/api';
</script>

<Select.Root type="single" bind:value={lessonApi.currentLocale}>
  <Select.Trigger class="h-9 w-[120px]">
    {LANGUAGES.find((lang) => lang.id === lessonApi.currentLocale)?.text || 'Language'}
  </Select.Trigger>
  <Select.Content>
    <Select.Group>
      {#each LANGUAGES as lang (lang.id)}
        <Select.Item value={lang.id}>{lang.text}</Select.Item>
      {/each}
    </Select.Group>
  </Select.Content>
</Select.Root>
