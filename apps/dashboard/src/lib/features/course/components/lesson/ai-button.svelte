<script lang="ts">
  import ListTodoIcon from '@lucide/svelte/icons/list-todo';
  import ListChecksIcon from '@lucide/svelte/icons/list-checks';
  import NotepadTextIcon from '@lucide/svelte/icons/notepad-text';
  import * as Popover from '@cio/ui/base/popover';
  import WandSparklesIcon from '@lucide/svelte/icons/wand-sparkles';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    isLoading?: SvelteStore<boolean>;
    callAI?: (type: string) => void;
  }
  let { isLoading, callAI = () => {} }: Props = $props();

  let openPopover = $state<boolean>(false);
  let aiButtonClass =
    'flex items-center px-5 py-2 border border-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md w-full mb-2';
</script>

<!-- Update this when ai-sdk is updated -->
<div class="hidden flex-row-reverse">
  <Popover.Root>
    <Popover.Trigger>
      <Button
        variant="outline"
        onclick={() => {
          openPopover = !openPopover;
        }}
        loading={$isLoading}
        disabled={$isLoading}
      >
        <WandSparklesIcon size={16} />
        AI
      </Button>
    </Popover.Trigger>
    <Popover.Content align="start" class="w-80">
      <div class="p-2">
        <button class={aiButtonClass} onclick={() => callAI('outline')}>
          <ListChecksIcon size={16} />
          {$t('course.navItem.lessons.materials.tabs.note.ai.outline')}
        </button>
        <button class={aiButtonClass} onclick={() => callAI('note')}>
          <NotepadTextIcon size={16} />
          {$t('course.navItem.lessons.materials.tabs.note.ai.note')}
        </button>
        <button class={aiButtonClass} onclick={() => callAI('activities')}>
          <ListTodoIcon size={16} />
          {$t('course.navItem.lessons.materials.tabs.note.ai.activities')}
        </button>
      </div>
    </Popover.Content>
  </Popover.Root>
</div>
