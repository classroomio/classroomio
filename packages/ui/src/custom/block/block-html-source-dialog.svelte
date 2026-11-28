<script lang="ts">
  import { tick } from 'svelte';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import CodeXmlIcon from '@lucide/svelte/icons/code-xml';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import XIcon from '@lucide/svelte/icons/x';
  import * as Dialog from '../../base/dialog';
  import { Button } from '../../base/button';
  import { Textarea } from '../../base/textarea';
  import * as UnderlineTabs from '../underline-tabs';
  import { cn } from '../../tools';
  import type { HtmlSourceDialogLabels, HtmlTemplate, HtmlTemplateTone } from './types';

  interface Props {
    open: boolean;
    templates: HtmlTemplate[];
    labels: HtmlSourceDialogLabels;
    generating?: boolean;
    onFile: (file: File) => void;
    onGenerate: (prompt: string) => void;
    onCode: (html: string) => void;
  }

  let { open = $bindable(false), templates, labels, generating = false, onFile, onGenerate, onCode }: Props = $props();

  const TONE_CLASSES: Record<HtmlTemplateTone, string> = {
    orange: 'ui:bg-orange-500/10 ui:text-orange-600',
    pink: 'ui:bg-pink-500/10 ui:text-pink-600',
    red: 'ui:bg-red-500/10 ui:text-red-600',
    yellow: 'ui:bg-yellow-500/15 ui:text-yellow-700',
    blue: 'ui:bg-blue-500/10 ui:text-blue-600',
    green: 'ui:bg-green-500/10 ui:text-green-700'
  };

  let tab = $state('add');
  let dragging = $state(false);
  let fileInput = $state<HTMLInputElement | null>(null);
  let promptInput = $state<HTMLTextAreaElement | null>(null);
  let selectedTemplate = $state<HtmlTemplate | null>(null);
  let prompt = $state('');
  let code = $state('');

  const promptExpanded = $derived(!!selectedTemplate || prompt.length > 0);

  function pickFile(file: File | undefined) {
    if (!file || generating) return;

    onFile(file);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragging = false;
    pickFile(event.dataTransfer?.files[0]);
  }

  async function selectTemplate(template: HtmlTemplate) {
    selectedTemplate = template;
    prompt = template.prompt;
    await tick();
    promptInput?.focus();
  }

  function clearTemplate() {
    selectedTemplate = null;
    prompt = '';
  }

  function submitPrompt() {
    const trimmed = prompt.trim();
    if (!trimmed || generating) return;

    onGenerate(trimmed);
  }

  function handlePromptKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey) return;

    event.preventDefault();
    submitPrompt();
  }

  function submitCode() {
    const trimmed = code.trim();
    if (!trimmed || generating) return;

    onCode(trimmed);
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="ui:z-[300]! ui:w-[95%] ui:max-w-2xl!">
    <Dialog.Header>
      <Dialog.Title>{labels.title}</Dialog.Title>
    </Dialog.Header>

    <div class="ui:w-full ui:p-2">
      <UnderlineTabs.Root bind:value={tab}>
        <UnderlineTabs.List>
          <UnderlineTabs.Trigger value="add">{labels.addTab}</UnderlineTabs.Trigger>
          <UnderlineTabs.Trigger value="code">{labels.codeTab}</UnderlineTabs.Trigger>
        </UnderlineTabs.List>

        <UnderlineTabs.Content value="add">
          <div class="ui:flex ui:flex-col ui:gap-4">
            <button
              type="button"
              class={cn(
                'ui:border-input ui:bg-muted/30 ui:hover:bg-muted/60 ui:flex ui:w-full ui:cursor-pointer ui:flex-col ui:items-center ui:justify-center ui:gap-1 ui:rounded-lg ui:border-2 ui:border-dashed ui:px-6 ui:py-8 ui:text-center ui:transition-colors ui:disabled:cursor-not-allowed ui:disabled:opacity-60',
                dragging && 'ui:border-primary ui:bg-primary/5'
              )}
              disabled={generating}
              data-testid="html-source-upload"
              onclick={() => fileInput?.click()}
              ondragover={(event) => {
                event.preventDefault();
                dragging = true;
              }}
              ondragleave={() => (dragging = false)}
              ondrop={handleDrop}
            >
              <span class="ui:text-muted-foreground ui:flex ui:items-center ui:gap-2 ui:text-sm ui:font-medium">
                <CodeXmlIcon size={16} />
                {labels.upload}
              </span>
              <span class="ui:text-muted-foreground ui:text-xs">{labels.uploadHint}</span>
            </button>
            <input
              bind:this={fileInput}
              type="file"
              accept=".html,.htm,text/html"
              class="ui:hidden"
              onchange={(event) => {
                pickFile(event.currentTarget.files?.[0]);
                event.currentTarget.value = '';
              }}
            />

            <div class="ui:flex ui:flex-col ui:gap-2">
              <p class="ui:text-muted-foreground ui:m-0 ui:text-xs ui:font-medium">{labels.createWithAi}</p>

              {#if !promptExpanded}
                <div class="ui:grid ui:grid-cols-2 ui:gap-2 ui:sm:grid-cols-3">
                  {#each templates as template (template.id)}
                    {@const TemplateIcon = template.icon}
                    <button
                      type="button"
                      class="ui:border-border ui:hover:bg-muted ui:flex ui:cursor-pointer ui:items-center ui:gap-3 ui:rounded-lg ui:border ui:p-2 ui:text-left ui:text-sm ui:transition-colors"
                      data-testid="html-source-template-{template.id}"
                      onclick={() => void selectTemplate(template)}
                    >
                      <span
                        class={cn(
                          'ui:flex ui:size-8 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-md',
                          TONE_CLASSES[template.tone]
                        )}
                      >
                        <TemplateIcon size={16} />
                      </span>
                      {template.label}
                    </button>
                  {/each}
                </div>
              {/if}

              <form
                class={cn(
                  'ui:border-input ui:focus-within:border-primary ui:focus-within:ring-primary/20 ui:flex ui:flex-col ui:gap-2 ui:border ui:transition ui:focus-within:ring-2',
                  promptExpanded ? 'ui:rounded-lg ui:p-3' : 'ui:rounded-full ui:px-3 ui:py-1'
                )}
                onsubmit={(event) => {
                  event.preventDefault();
                  submitPrompt();
                }}
              >
                {#if selectedTemplate}
                  {@const SelectedIcon = selectedTemplate.icon}
                  <span
                    class="ui:border-border ui:flex ui:w-fit ui:items-center ui:gap-1.5 ui:rounded-full ui:border ui:py-0.5 ui:pr-1 ui:pl-2 ui:text-xs ui:font-medium"
                  >
                    <SelectedIcon size={12} />
                    {selectedTemplate.label}
                    <button
                      type="button"
                      class="ui:text-muted-foreground ui:hover:text-foreground ui:flex ui:cursor-pointer ui:rounded-full ui:p-0.5"
                      aria-label={labels.removeTemplate}
                      onclick={clearTemplate}
                    >
                      <XIcon size={12} />
                    </button>
                  </span>
                {/if}

                <div class="ui:flex ui:items-end ui:gap-2">
                  {#if !promptExpanded}
                    <SparklesIcon size={14} class="ui:text-muted-foreground ui:mb-2.5 ui:shrink-0" />
                  {/if}
                  <Textarea
                    bind:ref={promptInput}
                    bind:value={prompt}
                    rows={promptExpanded ? 4 : 1}
                    disabled={generating}
                    placeholder={labels.describePlaceholder}
                    aria-label={labels.createWithAi}
                    data-testid="html-source-prompt"
                    class={cn(
                      'ui:min-h-0 ui:flex-1 ui:resize-none ui:border-0 ui:bg-transparent ui:px-0 ui:text-sm ui:shadow-none ui:focus-visible:ring-0',
                      promptExpanded ? 'ui:min-h-24' : 'ui:h-9 ui:py-2'
                    )}
                    onkeydown={handlePromptKeydown}
                  />
                  {#if promptExpanded || generating}
                    <Button
                      type="submit"
                      size="icon-sm"
                      class="ui:shrink-0 ui:rounded-full"
                      disabled={!prompt.trim() || generating}
                      aria-label={generating ? labels.generating : labels.generate}
                      title={generating ? labels.generating : labels.generate}
                      testId="html-source-generate"
                    >
                      {#if generating}
                        <LoaderCircleIcon class="ui:size-4 ui:animate-spin" />
                      {:else}
                        <ArrowUpIcon size={14} />
                      {/if}
                    </Button>
                  {:else}
                    <span
                      class="ui:bg-muted ui:text-muted-foreground ui:mb-2 ui:shrink-0 ui:rounded ui:px-1.5 ui:py-0.5 ui:text-[10px] ui:font-medium"
                    >
                      {labels.beta}
                    </span>
                  {/if}
                </div>

                {#if generating}
                  <p class="ui:text-muted-foreground ui:m-0 ui:text-xs" aria-live="polite">{labels.generating}</p>
                {/if}
              </form>
            </div>
          </div>
        </UnderlineTabs.Content>

        <UnderlineTabs.Content value="code">
          <div class="ui:flex ui:flex-col ui:gap-3 ui:p-1">
            <Textarea
              bind:value={code}
              rows={12}
              placeholder={labels.codePlaceholder}
              aria-label={labels.codeTab}
              spellcheck="false"
              class="ui:font-mono ui:text-xs"
            />
            <Button type="button" class="ui:self-start" disabled={!code.trim() || generating} onclick={submitCode}
              >{labels.insert}</Button
            >
          </div>
        </UnderlineTabs.Content>
      </UnderlineTabs.Root>
    </div>
  </Dialog.Content>
</Dialog.Root>
