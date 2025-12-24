<script lang="ts">
  import { Label } from '@cio/ui/base/label';
  import * as Select from '@cio/ui/base/select';

  import type { TLocale } from '@cio/db/types';
  import { LANGUAGES } from '$lib/utils/constants/translation';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    className?: string;
    value?: TLocale;
    hasLangChanged?: boolean;
    change?: () => void;
  }

  let { className = '', value = $bindable('en'), hasLangChanged = $bindable(false), change }: Props = $props();

  function handleSelect(selectedValue: string) {
    value = selectedValue as TLocale;
    hasLangChanged = true;
    if (change) {
      change();
    }
  }

  const triggerContent = $derived(
    LANGUAGES.find((lang) => lang.id === value)?.text ?? $t('settings.account.select_language')
  );
</script>

<div class={className}>
  <Label>{$t('settings.account.language')}</Label>
  <Select.Root type="single" bind:value onValueChange={handleSelect}>
    <Select.Trigger>
      {triggerContent}
    </Select.Trigger>
    <Select.Content>
      {#each LANGUAGES as lang}
        <Select.Item value={lang.id} label={lang.text}>
          {lang.text}
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
</div>
