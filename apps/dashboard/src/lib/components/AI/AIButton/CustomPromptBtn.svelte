<script lang="ts">
  // import { preventDefault } from '$lib/utils/functions/svelte';
  // import { writable } from 'svelte/store';
  // // import { useCompletion } from 'ai/svelte';
  // import WandSparklesIcon from '@lucide/svelte/icons/wand-sparkles';
  // import { IconButton } from '$lib/components/IconButton';
  // import { HTMLRender } from '$features/ui';
  // import { t } from '$lib/utils/functions/translations';

  // interface Props {
  //   className?: string;
  //   handleInsert?: any;
  //   defaultPrompt?: string;
  //   alignPopover?: PopoverProps['align'];
  //   isHTML?: boolean;
  // }

  // let {
  //   className = '',
  //   handleInsert = (_v: string) => {},
  //   defaultPrompt = '',
  //   alignPopover = 'left',
  //   isHTML = false
  // }: Props = $props();

  // let openPopover = $state(false);
  // let plainText = $state('');
  // let textRef: HTMLParagraphElement | undefined = $state();
  // let prompt: string = $state(defaultPrompt);

  // let isSubmitted = $state(false);

  // let isLoading = writable(false);
  // // const { input, handleSubmit, completion, isLoading } = useCompletion({
  // //   api: '/api/completion/customprompt'
  // // });

  // function restart() {
  //   isSubmitted = false;
  //   plainText = '';
  // }

  // function onCompletion(completion: string) {
  //   plainText = completion;
  //   if (textRef) {
  //     textRef.scrollTop = textRef.scrollHeight;
  //   }
  // }

  // // function callAI(prompt: string, rephrase: boolean) {
  // //   isSubmitted = true;

  // //   $input = rephrase ? `${$t('ai.can_you')}: ${plainText}` : prompt;

  // //   setTimeout(() => {
  // //     handleSubmit({ preventDefault: () => {} });
  // //   }, 500);
  // // }

  // $effect(() => {
  //   onCompletion($completion);
  // });

  // $effect(() => {
  //   prompt = defaultPrompt;
  // });
</script>

<div></div>
<!-- 
<div class="{className} relative z-[100]">
  <IconButton
    contained={true}
    color="ui:text-primary dark:bg-neutral-500 dark:text-white"
    size="large"
    onClick={() => (openPopover = !openPopover)}
  >
    <MagicWandFilled  />
    <Popover caret align={alignPopover} bind:open={openPopover}>
      <div class="h-[220px] w-[300px] p-2 text-start">
        {#if isSubmitted}
          <div class="h-[200px]">
            <div
              bind:this={textRef}
              class="my-1 h-[82%] w-full overflow-y-auto bg-white p-2 text-start text-sm dark:bg-neutral-700"
            >
              {#if isHTML}
                <HTMLRender>{plainText}</HTMLRender>
              {:else}
                <p class="font-normal">
                  {plainText}
                </p>
              {/if}
            </div>
            <div class="ml-2 flex gap-5">
              <button
                class="cursor-pointer rounded-md border-[1px] px-4 py-2 text-xs font-medium"
                onclick={() => {
                  handleInsert(plainText);
                  openPopover = false;
                }}
                type="button"
                disabled={$isLoading}
              >
                {#if $isLoading}
                  <Loading withOverlay={false} small />
                {:else}
                  {$t('ai.insert')}
                {/if}
              </button>
              <button
                class="cursor-pointer rounded-md border-[1px] px-4 py-2 text-xs font-medium {$isLoading &&
                  'cursor-not-allowed opacity-25'}"
                onclick={preventDefault(() => callAI(prompt, true))}
                type="button"
                disabled={$isLoading}
              >
                {$t('ai.rephrase')}
              </button>
              {#if !$isLoading}
                <button
                  class="cursor-pointer rounded-md border-[1px] px-4 py-2 text-xs font-medium"
                  onclick={preventDefault(restart)}
                  type="button"
                >
                  {$t('ai.reset')}
                </button>
              {/if}
            </div>
          </div>
        {:else}
          <div class="h-full">
            <p class="mb-2 ml-1 text-sm font-medium">{$t('ai.help_me')}</p>
            <textarea
              bind:value={prompt}
              class="m-0 h-[65%] w-full rounded-lg border-0 text-sm dark:text-black"
              placeholder={$t('ai.placeholder')}
            ></textarea>
            <button
              class="m-0 flex rounded-md border px-4 py-2 text-xs font-medium"
              onclick={preventDefault(() => callAI(prompt, false))}
              type="button"
            >
              {$t('ai.text')}
            </button>
          </div>
        {/if}
      </div>
    </Popover>
  </IconButton>
</div> -->
