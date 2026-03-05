<script lang="ts">
  import { tick } from 'svelte';
  import { env } from '$env/dynamic/public';
  import Close from 'carbon-icons-svelte/lib/Close.svelte';
  import Send from 'carbon-icons-svelte/lib/Send.svelte';
  import MagicWandFilled from 'carbon-icons-svelte/lib/MagicWandFilled.svelte';
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import ChevronDown from 'carbon-icons-svelte/lib/ChevronDown.svelte';
  import { aiAssistantStore, SUPPORTED_MODELS } from './store';
  import { getAccessToken } from '$lib/utils/functions/supabase';
  import { t } from '$lib/utils/functions/translations';

  let inputValue = '';
  let messagesContainer: HTMLDivElement;
  let modelPickerOpen = false;

  const QUICK_ACTIONS = [
    {
      label: 'Draft a new lesson',
      prompt: 'Draft a new lesson for this course'
    },
    {
      label: 'Generate 5 quiz questions',
      prompt: 'Generate 5 quiz questions based on the current lesson content'
    },
    {
      label: 'Improve lesson clarity',
      prompt: 'Review and improve the clarity and structure of the current lesson'
    }
  ];

  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  $: if ($aiAssistantStore.messages.length) {
    tick().then(scrollToBottom);
  }

  $: selectedModelName =
    SUPPORTED_MODELS.find((m) => m.id === $aiAssistantStore.selectedModel)?.name ??
    $aiAssistantStore.selectedModel;

  async function sendMessage(messageText?: string) {
    const text = (messageText ?? inputValue).trim();
    if (!text || $aiAssistantStore.isLoading) return;

    inputValue = '';
    modelPickerOpen = false;

    aiAssistantStore.addMessage({ role: 'user', content: text });
    aiAssistantStore.setLoading(true);

    await tick();
    scrollToBottom();

    try {
      const token = await getAccessToken();
      const serverUrl = env.PUBLIC_SERVER_URL;

      if (!serverUrl) {
        aiAssistantStore.addMessage({
          role: 'assistant',
          content: $t('ai_assistant.error_no_server'),
          isError: true
        });
        return;
      }

      const history = $aiAssistantStore.messages
        .slice(0, -1)
        .filter((m) => !m.isError)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(
        `${serverUrl}/course/${$aiAssistantStore.courseId}/agent/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            message: text,
            history,
            model: $aiAssistantStore.selectedModel,
            context: {
              lessonId: $aiAssistantStore.lessonId ?? undefined,
              exerciseId: $aiAssistantStore.exerciseId ?? undefined
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorMessage = $t('ai_assistant.error_generic');
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) errorMessage = errorJson.error;
        } catch {
          // ignore
        }
        aiAssistantStore.addMessage({
          role: 'assistant',
          content: errorMessage,
          isError: true
        });
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        aiAssistantStore.addMessage({
          role: 'assistant',
          content: result.data.message,
          intent: result.data.intent,
          actions: result.data.actions
        });
      } else {
        aiAssistantStore.addMessage({
          role: 'assistant',
          content: result.error ?? $t('ai_assistant.error_generic'),
          isError: true
        });
      }
    } catch (error) {
      console.error('AI assistant error:', error);
      aiAssistantStore.addMessage({
        role: 'assistant',
        content: $t('ai_assistant.error_generic'),
        isError: true
      });
    } finally {
      aiAssistantStore.setLoading(false);
      await tick();
      scrollToBottom();
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
</script>

<aside
  class="ai-sidebar flex h-full flex-col border-l border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
>
  <!-- Header -->
  <div
    class="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-neutral-700"
  >
    <div class="flex items-center gap-2">
      <MagicWandFilled size={16} class="text-primary-700 carbon-icon" />
      <span class="text-sm font-semibold dark:text-white">{$t('ai_assistant.title')}</span>
    </div>

    <div class="flex items-center gap-1">
      {#if $aiAssistantStore.messages.length > 0}
        <button
          class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          on:click={() => aiAssistantStore.clearMessages()}
          title={$t('ai_assistant.clear_chat')}
          aria-label={$t('ai_assistant.clear_chat')}
        >
          <TrashCan size={16} class="carbon-icon" />
        </button>
      {/if}
      <button
        class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        on:click={() => aiAssistantStore.close()}
        aria-label={$t('ai_assistant.close')}
      >
        <Close size={16} class="carbon-icon" />
      </button>
    </div>
  </div>

  <!-- Model picker -->
  <div class="relative flex-shrink-0 border-b border-gray-100 px-4 py-2 dark:border-neutral-800">
    <button
      class="flex w-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs transition-colors hover:border-gray-300 hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
      on:click={() => (modelPickerOpen = !modelPickerOpen)}
      aria-haspopup="listbox"
      aria-expanded={modelPickerOpen}
    >
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="font-medium text-gray-700 dark:text-neutral-200 truncate">{selectedModelName}</span>
      </div>
      <ChevronDown
        size={12}
        class="carbon-icon flex-shrink-0 text-gray-400 transition-transform {modelPickerOpen ? 'rotate-180' : ''}"
      />
    </button>

    {#if modelPickerOpen}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="fixed inset-0 z-40"
        on:click={() => (modelPickerOpen = false)}
      />
      <ul
        class="absolute left-4 right-4 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
        role="listbox"
        aria-label={$t('ai_assistant.model_picker_label')}
      >
        {#each SUPPORTED_MODELS as model}
          <li role="option" aria-selected={$aiAssistantStore.selectedModel === model.id}>
            <button
              class="flex w-full items-start gap-2 px-3 py-2.5 text-left text-xs transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700
                {$aiAssistantStore.selectedModel === model.id
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : ''}"
              on:click={() => {
                aiAssistantStore.setModel(model.id);
                modelPickerOpen = false;
              }}
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <span class="font-medium text-gray-800 dark:text-neutral-100">{model.name}</span>
                  {#if model.recommended}
                    <span class="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {$t('ai_assistant.recommended')}
                    </span>
                  {/if}
                  {#if $aiAssistantStore.selectedModel === model.id}
                    <span class="ml-auto text-primary-700 dark:text-blue-400">✓</span>
                  {/if}
                </div>
                <p class="mt-0.5 text-gray-400 dark:text-neutral-500">{model.description}</p>
              </div>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <!-- Context badge -->
  {#if $aiAssistantStore.lessonId}
    <div class="flex-shrink-0 border-b border-gray-100 px-4 py-2 dark:border-neutral-800">
      <span
        class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      >
        {$t('ai_assistant.lesson_context')}
      </span>
    </div>
  {/if}

  <!-- Messages -->
  <div class="flex-1 overflow-y-auto px-4 py-4" bind:this={messagesContainer}>
    {#if $aiAssistantStore.messages.length === 0}
      <div class="flex h-full flex-col items-center justify-center text-center">
        <MagicWandFilled size={32} class="mb-3 carbon-icon text-gray-200 dark:text-neutral-700" />
        <p class="mb-1 text-sm font-medium text-gray-600 dark:text-neutral-400">
          {$t('ai_assistant.empty_title')}
        </p>
        <p class="mb-5 text-xs text-gray-400 dark:text-neutral-600">
          {$t('ai_assistant.empty_subtitle')}
        </p>
        <div class="flex w-full flex-col gap-2">
          {#each QUICK_ACTIONS as action}
            <button
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-xs text-gray-600 transition-colors
                hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700
                dark:border-neutral-700 dark:text-neutral-400
                dark:hover:border-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
              on:click={() => sendMessage(action.prompt)}
            >
              {action.label}
            </button>
          {/each}
        </div>
      </div>
    {:else}
      {#each $aiAssistantStore.messages as message (message.id)}
        <div
          class="mb-3 {message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}"
        >
          <div
            class="max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed
              {message.role === 'user'
              ? 'bg-primary-700 text-white'
              : message.isError
                ? 'border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-neutral-100'}"
          >
            <p class="whitespace-pre-wrap">{message.content}</p>
            {#if message.actions?.length}
              <div
                class="mt-2 border-t pt-1.5 {message.role === 'user'
                  ? 'border-white/20'
                  : 'border-gray-200 dark:border-neutral-700'}"
              >
                {#each message.actions as action}
                  <p class="text-[10px] opacity-70">✓ {action.description}</p>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/each}

      {#if $aiAssistantStore.isLoading}
        <div class="mb-3 flex justify-start">
          <div class="rounded-xl bg-gray-100 px-3 py-2 dark:bg-neutral-800">
            <div class="flex gap-1">
              <span class="typing-dot" />
              <span class="typing-dot" style="animation-delay:0.2s" />
              <span class="typing-dot" style="animation-delay:0.4s" />
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Input -->
  <div class="flex-shrink-0 border-t border-gray-200 p-3 dark:border-neutral-700">
    <div
      class="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2
        focus-within:border-blue-400
        dark:border-neutral-700 dark:bg-neutral-800 dark:focus-within:border-blue-500"
    >
      <textarea
        bind:value={inputValue}
        on:keydown={handleKeyDown}
        placeholder={$t('ai_assistant.input_placeholder')}
        rows={1}
        class="flex-1 resize-none bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none dark:text-neutral-100 dark:placeholder-neutral-500"
        disabled={$aiAssistantStore.isLoading}
      />
      <button
        on:click={() => sendMessage()}
        disabled={!inputValue.trim() || $aiAssistantStore.isLoading}
        class="flex-shrink-0 rounded-lg bg-primary-700 p-1.5 text-white transition-opacity
          disabled:cursor-not-allowed disabled:opacity-40 hover:bg-primary-800"
        aria-label={$t('ai_assistant.send')}
      >
        <Send size={16} class="carbon-icon" />
      </button>
    </div>
    <p class="mt-1.5 text-center text-[10px] text-gray-400 dark:text-neutral-600">
      {$t('ai_assistant.disclaimer')}
    </p>
  </div>
</aside>

<style>
  .ai-sidebar {
    width: 320px;
    min-width: 280px;
    flex-shrink: 0;
  }

  @media (max-width: 1280px) {
    .ai-sidebar {
      width: 300px;
    }
  }

  .typing-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #9ca3af;
    animation: typing-bounce 1s infinite ease-in-out;
  }

  @keyframes typing-bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40%           { transform: translateY(-4px); opacity: 1; }
  }
</style>
