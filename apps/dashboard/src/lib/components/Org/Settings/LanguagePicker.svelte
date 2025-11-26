<script lang="ts">
  import { Label } from '@cio/ui/base/label';
  import * as Select from '@cio/ui/base/select';

<<<<<<< HEAD
  import { LOCALE } from '$lib/utils/types';
=======
  import type { TLocale } from '@cio/db/types';
>>>>>>> feat/release-v2
  import { LANGUAGES } from '$lib/utils/constants/translation';
  import { t, initialized } from '$lib/utils/functions/translations';

  interface Props {
    className?: string;
    value?: TLocale;
    hasLangChanged?: boolean;
    change?: () => void;
  }

<<<<<<< HEAD
  let { className = '', value = $bindable(LOCALE.EN), hasLangChanged = $bindable(false), change }: Props = $props();

  function handleSelect(selectedValue: string) {
    value = selectedValue as LOCALE;
=======
  let { className = '', value = $bindable('en'), hasLangChanged = $bindable(false), change }: Props = $props();

  function handleSelect(selectedValue: string) {
    value = selectedValue as TLocale;
>>>>>>> feat/release-v2
    hasLangChanged = true;
    change?.();
  }
</script>

{#if $initialized}
  <div class={className}>
    <Label class="mb-2 block">{$t('content.toggle_label')}</Label>
    <Select.Root type="single" bind:value onValueChange={handleSelect}>
      <Select.Trigger class="w-full">
        <p>{value ? LANGUAGES.find((lang) => lang.id === value)?.text : 'Pick a Language'}</p>
      </Select.Trigger>
      <Select.Content>
        {#each LANGUAGES as language}
          <Select.Item value={language.id}>{language.text}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>
{/if}
