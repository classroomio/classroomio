<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { ChatTextarea, type MentionItem } from '@cio/ui/custom/chat-textarea';
  import { LessonIcon, ExerciseIcon } from '@cio/ui/custom/moving-icons';
  import PaperclipIcon from '@lucide/svelte/icons/paperclip';
  import SquareIcon from '@lucide/svelte/icons/square';
  import XIcon from '@lucide/svelte/icons/x';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import TableOfContentsIcon from '@lucide/svelte/icons/table-of-contents';
  import { t } from '$lib/utils/functions/translations';
  import { isFreePlan } from '$lib/utils/store/org';
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import ModelPicker from '$features/ai-assistant/model-picker.svelte';
  import type { AgentModelId } from '@cio/utils/agent-models';

  interface UploadedDocument {
    id: string;
    name: string;
  }

  interface Props {
    inputValue: string;
    isStreaming: boolean;
    isExhausted: boolean;
    isUploading: boolean;
    error: Error | null | undefined;
    mentionItems: MentionItem[];
    uploadedDocument: UploadedDocument | null;
    selectedModel: AgentModelId;
    onSend: () => void;
    onStop: () => void;
    onFileSelect: (file: File) => void;
    onRemoveDocument: () => void;
    onSelectModel: (id: AgentModelId) => void;
  }

  let {
    inputValue = $bindable(),
    isStreaming,
    isExhausted,
    isUploading,
    error,
    mentionItems,
    uploadedDocument,
    selectedModel,
    onSend,
    onStop,
    onFileSelect,
    onRemoveDocument,
    onSelectModel
  }: Props = $props();

  let fileInputEl: HTMLInputElement | undefined = $state();
  let chatTextareaRef: HTMLTextAreaElement | null = $state(null);
  let wasBusy = $state(false);

  $effect(() => {
    const isBusy = isStreaming || isUploading;

    if (isBusy) {
      wasBusy = true;
      return;
    }

    if (!wasBusy || isExhausted || !chatTextareaRef) {
      return;
    }

    wasBusy = false;

    requestAnimationFrame(() => {
      chatTextareaRef?.focus();
    });
  });

  function handlePaperclipClick() {
    if ($isFreePlan) {
      openUpgradeModal();
      return;
    }
    fileInputEl?.click();
  }

  function handleFileChange(e: Event) {
    const target = e.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      onFileSelect(file);
      target.value = '';
    }
  }

  function getTypeLabel(item: MentionItem) {
    if (item.type === 'EXERCISE') return t.get('ai_assistant.mention_exercise');
    if (item.type === 'SECTION') return t.get('ai_assistant.mention_section');

    return t.get('ai_assistant.mention_lesson');
  }
</script>

<input
  bind:this={fileInputEl}
  type="file"
  accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
  class="hidden"
  onchange={handleFileChange}
/>

<div class="border-t px-3 pt-3 pb-1.5">
  {#if isExhausted}
    <div
      class="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
    >
      {$t('ai_assistant.tokens_exhausted')}
    </div>
  {:else}
    {#if error}
      <div
        class="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
      >
        {error.message}
      </div>
    {/if}

    {#if isUploading}
      <div class="mb-2 flex items-center gap-2 rounded border px-3 py-2 text-xs">
        <LoaderIcon size={12} class="animate-spin" />
        <span class="ui:text-muted-foreground">{$t('ai_assistant.uploading_document')}</span>
      </div>
    {:else if uploadedDocument}
      <div class="mb-2 flex items-center gap-2 rounded border px-3 py-2 text-xs">
        <FileTextIcon size={12} class="ui:text-primary shrink-0" />
        <span class="min-w-0 flex-1 truncate">{uploadedDocument.name}</span>
        <button
          onclick={onRemoveDocument}
          class="ui:text-muted-foreground hover:ui:text-foreground shrink-0 rounded p-0.5 transition-colors"
        >
          <XIcon size={12} />
        </button>
      </div>
    {/if}

    <div class="flex items-end gap-2">
      <ChatTextarea
        bind:ref={chatTextareaRef}
        bind:value={inputValue}
        {mentionItems}
        onSubmit={onSend}
        placeholder={$t('ai_assistant.input_placeholder')}
        disabled={isStreaming || isUploading}
        typeLabel={getTypeLabel}
        emptyMessage={t.get('ai_assistant.mention_no_results')}
        rows={2}
        class="flex-1"
      >
        {#snippet icon({ item })}
          {#if item.type === 'EXERCISE'}
            <ExerciseIcon size={14} />
          {:else if item.type === 'SECTION'}
            <TableOfContentsIcon size={14} />
          {:else}
            <LessonIcon size={14} />
          {/if}
        {/snippet}

        {#snippet actions()}
          <button
            onclick={handlePaperclipClick}
            disabled={isUploading}
            class="ui:text-muted-foreground hover:ui:bg-muted shrink-0 rounded-md p-1.5 transition-colors disabled:pointer-events-none disabled:opacity-40"
            title={$isFreePlan ? $t('ai_assistant.upgrade_to_upload') : $t('ai_assistant.attach_document')}
          >
            <PaperclipIcon size={16} />
          </button>

          <div class="flex-1"></div>

          {#if isStreaming}
            <Button size="icon" variant="outline" onclick={onStop} class="size-7 shrink-0">
              <SquareIcon size={12} />
            </Button>
          {:else}
            <ModelPicker value={selectedModel} disabled={isStreaming} onChange={onSelectModel} />
          {/if}
        {/snippet}
      </ChatTextarea>
    </div>
  {/if}
</div>
