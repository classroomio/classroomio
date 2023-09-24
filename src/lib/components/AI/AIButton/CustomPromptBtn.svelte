<script lang="ts">
  import { useCompletion } from 'ai/svelte';
  import { Popover } from 'carbon-components-svelte';
  import type { PopoverProps } from 'carbon-components-svelte/types/Popover/Popover.svelte';
  import MagicWandFilled from 'carbon-icons-svelte/lib/MagicWandFilled.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { Loading } from 'carbon-components-svelte';

  export let className = '';
  export let handleInsert = (v: string) => {};
  export let defaultPrompt = '';
  export let alignPopover: PopoverProps['align'] = 'left';
  export let isHTML = false;

  let openPopover = false;
  let plainText = '';
  let textRef: HTMLParagraphElement;
  let prompt: string = defaultPrompt;

  let isSubmitted = false;

  const { input, handleSubmit, completion, isLoading } = useCompletion({
    api: '/api/completion/customprompt'
  });

  function restart() {
    isSubmitted = false;
    plainText = '';
  }

  function onCompletion(completion: string) {
    plainText = completion;
    if (textRef) {
      textRef.scrollTop = textRef.scrollHeight;
    }
  }

  function callAI(prompt: string, rephrase: boolean) {
    isSubmitted = true;

    $input = rephrase ? `Can you please rephrase this: ${plainText}` : prompt;

    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} });
    }, 500);
  }

  $: onCompletion($completion);
</script>

<div class="{className} relative z-[100]">
  <IconButton
    contained={true}
    color="text-primary-700 dark:bg-neutral-800"
    size="large"
    onClick={() => (openPopover = !openPopover)}
  >
    <MagicWandFilled size={16} class="carbon-icon" />
    <Popover caret align={alignPopover} bind:open={openPopover}>
      <button
        class="p-2 w-[300px] h-[220px] text-start"
        type="button"
        on:click={(e) => e.stopPropagation()}
      >
        {#if isSubmitted}
          <div class="h-[200px]">
            <div
              bind:this={textRef}
              class="h-[82%] bg-white dark:text-black p-2 overflow-y-auto text-sm text-start w-full my-1"
            >
              {#if isHTML}
                {@html plainText}
              {:else}
                <p class="font-normal">
                  {plainText}
                </p>
              {/if}
            </div>
            <div class="flex gap-5 ml-2">
              <button
                class="text-xs px-4 py-2 border-[1px] cursor-pointer rounded-md font-medium"
                on:click={() => {
                  handleInsert(plainText);
                  openPopover = false;
                }}
                type="button"
                disabled={$isLoading}
              >
                {#if $isLoading}
                  <Loading withOverlay={false} small />
                {:else}
                  Insert
                {/if}
              </button>
              <button
                class="text-xs px-4 py-2 border-[1px] cursor-pointer rounded-md font-medium {$isLoading &&
                  'opacity-25 cursor-not-allowed'}"
                on:click|preventDefault={() => callAI(prompt, true)}
                type="button"
                disabled={$isLoading}
              >
                Rephrase
              </button>
              {#if !$isLoading}
                <button
                  class="text-xs px-4 py-2 border-[1px] cursor-pointer rounded-md font-medium"
                  on:click|preventDefault={restart}
                  type="button"
                >
                  Reset
                </button>
              {/if}
            </div>
          </div>
        {:else}
          <div class="h-full">
            <p class="text-sm font-medium mb-2 ml-1">Help me write</p>
            <textarea
              bind:value={prompt}
              class="w-full border-0 rounded-lg h-[65%] text-sm m-0 dark:text-black"
              placeholder="Help me write a short description"
            />
            <button
              class="flex text-xs px-4 py-2 m-0 border rounded-md font-medium"
              on:click|preventDefault={() => callAI(prompt, false)}
              type="button"
            >
              Start typing...
            </button>
          </div>
        {/if}
      </button>
    </Popover>
  </IconButton>
</div>
