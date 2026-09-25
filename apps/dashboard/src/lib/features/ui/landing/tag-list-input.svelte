<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    title: string;
    helpText?: string;
    placeholder?: string;
    items: string[];
    onAdd: (value: string) => void;
    onRemove: (value: string) => void;
  }

  let { title, helpText, placeholder, items, onAdd, onRemove }: Props = $props();

  let draft = $state('');

  function handleAdd() {
    const value = draft.trim();
    if (!value) return;
    if (items.includes(value)) {
      draft = '';
      return;
    }
    onAdd(value);
    draft = '';
  }

  function handleKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAdd();
    }
  }
</script>

<div>
  <p class="mb-2 text-sm font-semibold">
    {title}
  </p>
  {#if helpText}
    <p class="mb-3 text-xs text-gray-500">
      {helpText}
    </p>
  {/if}

  <div class="flex gap-2">
    <Input bind:value={draft} onkeydown={handleKey} placeholder={placeholder ?? ''} />
    <Button type="button" variant="outline" size="sm" onclick={handleAdd} disabled={!draft.trim()}>
      <PlusIcon size={14} />
    </Button>
  </div>

  {#if items.length > 0}
    <div class="mt-3 flex flex-wrap gap-2">
      {#each items as item (item)}
        <span
          class="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700"
        >
          {item}
          <button
            type="button"
            class="text-gray-400 hover:text-gray-700"
            onclick={() => onRemove(item)}
            aria-label={$t('common.remove')}
          >
            <XIcon size={12} />
          </button>
        </span>
      {/each}
    </div>
  {/if}
</div>
