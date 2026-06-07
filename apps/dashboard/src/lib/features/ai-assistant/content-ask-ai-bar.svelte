<script lang="ts">
  import { browser } from '$app/environment';
  import { tick } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { Button } from '@cio/ui/base/button';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Separator } from '@cio/ui/base/separator';
  import * as Kbd from '@cio/ui/base/kbd';
  import { t } from '$lib/utils/functions/translations';
  import { sendPromptToAssistant } from '$features/ai-assistant/utils/store';

  interface Props {
    /** Width classes matching the page content column (e.g. mx-auto w-full max-w-3xl). */
    class?: string;
  }

  let { class: contentClass = 'mx-auto w-full max-w-3xl' }: Props = $props();

  const pageShellClass = 'mx-auto w-[90%] max-w-4xl px-3 sm:px-4 lg:max-w-5xl';

  let expanded = $state(false);
  let draft = $state('');
  let textareaRef: HTMLTextAreaElement | null = $state(null);

  const isMac = $derived(browser && /Mac|iPhone|iPad|iPod/.test(navigator.platform));

  const expandIn = { y: 20, duration: 280, easing: cubicOut };
  const expandOut = { y: 12, duration: 200, easing: cubicOut };
  const collapseIn = { duration: 200, easing: cubicOut };
  const collapseOut = { duration: 150, easing: cubicOut };

  function shouldIgnoreGlobalShortcut() {
    const active = document.activeElement;

    if (!active) {
      return false;
    }

    const tag = active.tagName;

    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      return true;
    }

    if (active instanceof HTMLElement && active.isContentEditable) {
      return true;
    }

    return false;
  }

  async function expand() {
    expanded = true;
    await tick();
    textareaRef?.focus();
  }

  function collapse() {
    expanded = false;
  }

  function handleTextareaBlur() {
    collapse();
  }

  function submit() {
    const trimmed = draft.trim();

    if (!trimmed) {
      return;
    }

    sendPromptToAssistant(trimmed);
    draft = '';
    collapse();
  }

  function handleTextareaKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      collapse();

      return;
    }

    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();
    submit();
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'i') {
      return;
    }

    if (expanded) {
      return;
    }

    if (shouldIgnoreGlobalShortcut()) {
      return;
    }

    event.preventDefault();
    void expand();
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if expanded}
  <div
    class="ui:bg-background ui:border-border fixed right-0 bottom-0 left-0 z-40 border-t py-3 shadow-sm md:left-[var(--sidebar-width,0px)]"
    in:fly={expandIn}
    out:fly={expandOut}
  >
    <div class={pageShellClass}>
      <div class={contentClass}>
        <Textarea
          bind:ref={textareaRef}
          bind:value={draft}
          rows={1}
          placeholder={$t('ai_assistant.content_input_placeholder')}
          aria-label={$t('ai_assistant.ask_ai_input_aria')}
          class="ui:min-h-10 ui:max-h-64 ui:resize-none ui:rounded-none ui:shadow-none"
          onkeydown={handleTextareaKeydown}
          onblur={handleTextareaBlur}
        />
      </div>
    </div>
  </div>
{:else}
  <div
    class="pointer-events-none fixed right-0 bottom-4 left-0 z-40 md:left-[var(--sidebar-width,0px)]"
    in:fade={collapseIn}
    out:fade={collapseOut}
  >
    <div class={pageShellClass}>
      <div class={`flex justify-center ${contentClass}`}>
        <Button
          variant="outline"
          class="ui:bg-background ui:shadow-sm pointer-events-auto"
          aria-label={$t('ai_assistant.ask_ai_expand_aria')}
          onclick={() => expand()}
          onmouseenter={() => expand()}
        >
          {$t('ai_assistant.ask_ai')}
          <Separator orientation="vertical" class="ui:!h-4" />
          <span class="ui:text-muted-foreground flex items-center gap-0.5 font-normal">
            {#if isMac}
              <Kbd.Root>⌘</Kbd.Root>
            {:else}
              <Kbd.Root>Ctrl</Kbd.Root>
            {/if}
            <Kbd.Root>I</Kbd.Root>
          </span>
        </Button>
      </div>
    </div>
  </div>
{/if}
