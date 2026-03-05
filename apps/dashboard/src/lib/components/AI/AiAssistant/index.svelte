<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { env } from '$env/dynamic/public';
  import Close from 'carbon-icons-svelte/lib/Close.svelte';
  import Send from 'carbon-icons-svelte/lib/Send.svelte';
  import MagicWandFilled from 'carbon-icons-svelte/lib/MagicWandFilled.svelte';
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import { aiAssistantStore } from './store';
  import { getAccessToken } from '$lib/utils/functions/supabase';
  import { t } from '$lib/utils/functions/translations';

  export let open = false;

  let inputValue = '';
  let messagesContainer: HTMLDivElement;
  let inputElement: HTMLTextAreaElement;
  let mounted = false;

  const dispatch = createEventDispatcher<{ close: void }>();

  const QUICK_ACTIONS = [
    { label: 'Draft a lesson outline', prompt: 'Draft a new lesson for this course' },
    { label: 'Generate 5 quiz questions', prompt: 'Generate 5 quiz questions based on the current lesson content' },
    { label: 'Improve lesson text', prompt: 'Review and improve the clarity of the current lesson text' }
  ];

  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  function scrollLock(isOpen: boolean) {
    if (mounted) {
      const body = document.querySelector('body');
      if (!body) return;
      body.style.overflow = isOpen ? 'hidden' : 'auto';
    }
  }

  $: scrollLock(open);

  $: if ($aiAssistantStore.messages.length) {
    tick().then(scrollToBottom);
  }

  async function sendMessage(messageText?: string) {
    const text = (messageText ?? inputValue).trim();
    if (!text || $aiAssistantStore.isLoading) return;

    inputValue = '';

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
        .slice(-10)
        .filter((m) => !m.isError)
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
            history: history.slice(0, -1),
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

  function handleClose() {
    dispatch('close');
    aiAssistantStore.close();
  }

  onMount(() => {
    mounted = true;
  });
</script>

<div
  class="ai-assistant-overlay"
  class:open
  on:click|self={handleClose}
  role="presentation"
  aria-hidden="true"
/>

<aside class="ai-assistant-panel bg-white dark:bg-neutral-900" class:open>
  <!-- Header -->
  <div
    class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-neutral-700"
  >
    <div class="flex items-center gap-2">
      <MagicWandFilled size={16} class="text-primary-700 carbon-icon" />
      <h3 class="text-sm font-semibold dark:text-white">{$t('ai_assistant.title')}</h3>
    </div>
    <div class="flex items-center gap-1">
      {#if $aiAssistantStore.messages.length > 0}
        <button
          class="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
          on:click={() => aiAssistantStore.clearMessages()}
          title={$t('ai_assistant.clear_chat')}
          aria-label={$t('ai_assistant.clear_chat')}
        >
          <TrashCan size={16} class="carbon-icon" />
        </button>
      {/if}
      <button
        class="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
        on:click={handleClose}
        aria-label={$t('ai_assistant.close')}
      >
        <Close size={16} class="carbon-icon" />
      </button>
    </div>
  </div>

  <!-- Context badge -->
  {#if $aiAssistantStore.lessonId}
    <div class="border-b border-gray-100 px-4 py-2 dark:border-neutral-800">
      <span
        class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      >
        {$t('ai_assistant.lesson_context')}
      </span>
    </div>
  {/if}

  <!-- Messages -->
  <div class="messages flex-1 overflow-y-auto px-4 py-4" bind:this={messagesContainer}>
    {#if $aiAssistantStore.messages.length === 0}
      <div class="flex h-full flex-col items-center justify-center text-center">
        <MagicWandFilled size={32} class="mb-3 text-gray-300 carbon-icon dark:text-neutral-600" />
        <p class="mb-1 text-sm font-medium text-gray-600 dark:text-neutral-400">
          {$t('ai_assistant.empty_title')}
        </p>
        <p class="mb-4 text-xs text-gray-400 dark:text-neutral-600">
          {$t('ai_assistant.empty_subtitle')}
        </p>

        <!-- Quick actions -->
        <div class="flex w-full flex-col gap-2">
          {#each QUICK_ACTIONS as action}
            <button
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-xs text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
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
          class="message mb-4 {message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}"
        >
          <div
            class="max-w-[85%] rounded-xl px-3 py-2 text-sm {message.role === 'user'
              ? 'bg-primary-700 text-white'
              : message.isError
                ? 'border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-neutral-100'}"
          >
            <p class="whitespace-pre-wrap leading-relaxed">{message.content}</p>

            {#if message.actions && message.actions.length > 0}
              <div class="mt-2 border-t border-white/20 pt-2">
                {#each message.actions as action}
                  <p class="text-xs opacity-75">✓ {action.description}</p>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/each}

      {#if $aiAssistantStore.isLoading}
        <div class="mb-4 flex justify-start">
          <div class="rounded-xl bg-gray-100 px-3 py-2 dark:bg-neutral-800">
            <div class="flex gap-1">
              <span class="typing-dot" />
              <span class="typing-dot" style="animation-delay: 0.2s" />
              <span class="typing-dot" style="animation-delay: 0.4s" />
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Input -->
  <div class="border-t border-gray-200 p-3 dark:border-neutral-700">
    <div
      class="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-blue-400 dark:border-neutral-700 dark:bg-neutral-800 dark:focus-within:border-blue-500"
    >
      <textarea
        bind:this={inputElement}
        bind:value={inputValue}
        on:keydown={handleKeyDown}
        placeholder={$t('ai_assistant.input_placeholder')}
        rows={1}
        class="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none dark:text-neutral-100 dark:placeholder-neutral-500"
        disabled={$aiAssistantStore.isLoading}
      />
      <button
        on:click={() => sendMessage()}
        disabled={!inputValue.trim() || $aiAssistantStore.isLoading}
        class="flex-shrink-0 rounded-lg bg-primary-700 p-1.5 text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40 hover:bg-primary-800"
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
  .ai-assistant-overlay {
    position: fixed;
    inset: 0;
    background: transparent;
    z-index: 49;
    display: none;
  }

  .ai-assistant-overlay.open {
    display: block;
  }

  .ai-assistant-panel {
    position: fixed;
    top: 0;
    right: 0;
    height: 100dvh;
    width: 380px;
    max-width: 100vw;
    z-index: 50;
    display: flex;
    flex-direction: column;
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }

  .ai-assistant-panel.open {
    transform: translateX(0);
  }

  .messages {
    flex: 1;
    min-height: 0;
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
    0%,
    80%,
    100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    40% {
      transform: translateY(-4px);
      opacity: 1;
    }
  }

  @media (max-width: 640px) {
    .ai-assistant-panel {
      width: 100vw;
    }
  }
</style>
