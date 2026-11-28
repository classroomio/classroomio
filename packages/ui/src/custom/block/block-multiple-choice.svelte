<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
  import CircleXIcon from '@lucide/svelte/icons/circle-x';
  import ImageIcon from '@lucide/svelte/icons/image';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import XIcon from '@lucide/svelte/icons/x';
  import { tick } from 'svelte';
  import { Button } from '../../base/button';
  import * as DropdownMenu from '../../base/dropdown-menu';
  import { Label } from '../../base/label';
  import * as RadioGroup from '../../base/radio-group';
  import { cn } from '../../tools';
  import { IconButton } from '../icon-button';
  import InlineText from './block-inline-text.svelte';
  import type { MultipleChoiceBlockLabels, MultipleChoiceBlockOption } from './types';

  interface Props {
    question: string;
    options: MultipleChoiceBlockOption[];
    correctOptionId: string;
    imageUrl?: string;
    editable?: boolean;
    minOptions?: number;
    maxOptions?: number;
    questionMaxLength?: number;
    optionMaxLength?: number;
    labels: MultipleChoiceBlockLabels;
    testId?: string;
    onQuestionInput?: (question: string) => void;
    onOptionInput?: (optionId: string, text: string) => void;
    onMarkCorrect?: (optionId: string) => void;
    onAddOption?: () => void;
    onRemoveOption?: (optionId: string) => void;
    onAddImage?: () => void;
    onRemoveImage?: () => void;
  }

  let {
    question,
    options,
    correctOptionId,
    imageUrl,
    editable = false,
    minOptions = 2,
    maxOptions = 10,
    questionMaxLength,
    optionMaxLength,
    labels,
    testId,
    onQuestionInput,
    onOptionInput,
    onMarkCorrect,
    onAddOption,
    onRemoveOption,
    onAddImage,
    onRemoveImage
  }: Props = $props();

  const groupId = $props.id();

  let selectedId = $state('');
  let checked = $state(false);
  let optionRefs = $state<Record<string, HTMLElement | null | undefined>>({});

  const canRemoveOption = $derived(options.length > minOptions);
  const canAddOption = $derived(options.length < maxOptions);
  const answeredCorrectly = $derived(checked && selectedId === correctOptionId);

  function optionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  async function addOption() {
    const knownIds = new Set(options.map((option) => option.id));
    onAddOption?.();
    await tick();

    const added = options.find((option) => !knownIds.has(option.id));
    if (added) optionRefs[added.id]?.focus();
  }

  function selectOption(optionId: string) {
    if (checked) return;

    selectedId = optionId;
  }

  function tryAgain() {
    selectedId = '';
    checked = false;
  }

  function editRowClass(isCorrect: boolean): string {
    return cn(
      'ui:group ui:flex ui:items-center ui:gap-3.5 ui:rounded-lg ui:bg-card ui:px-3.5 ui:py-3 ui:transition-colors',
      isCorrect ? 'ui:border-success ui:bg-success/10 ui:border-[1.5px]' : 'ui:border-border'
    );
  }

  function reviewRowClass(isSelected: boolean, isCorrect: boolean): string {
    if (checked && isCorrect) return 'ui:border-success ui:bg-success/10';
    if (checked && isSelected) return 'ui:border-destructive ui:bg-destructive/[0.08]';
    if (checked) return 'ui:border-border ui:bg-card ui:opacity-55';
    if (isSelected) {
      return 'ui:border-primary ui:bg-primary/[0.07] ui:ring-[3px] ui:ring-primary/15';
    }

    return 'ui:border-border ui:bg-card ui:hover:border-primary/55 ui:hover:bg-primary/[0.04]';
  }

  function reviewMarkClass(isSelected: boolean, isCorrect: boolean): string {
    if (checked && isCorrect) return 'ui:border-success ui:bg-success ui:text-white';
    if (checked && isSelected) return 'ui:border-destructive ui:bg-destructive ui:text-white';
    if (isSelected) return 'ui:border-primary ui:bg-primary ui:text-primary-foreground';

    return 'ui:border-input ui:bg-background ui:text-muted-foreground';
  }
</script>

<div class="ui:flex ui:flex-col ui:gap-[18px]" data-testid={testId}>
  {#if editable}
    <div class="ui:flex ui:items-center ui:justify-end">
      <div class="ui:bg-muted ui:flex ui:items-center ui:rounded-full ui:p-[3px]">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class="ui:text-foreground ui:hover:bg-card ui:flex ui:size-[26px] ui:items-center ui:justify-center ui:rounded-full ui:p-0 ui:transition"
            aria-label={labels.addMedia}
            title={labels.addMedia}
            data-testid={testId ? `${testId}-media` : undefined}
          >
            <ImageIcon size={13} />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item onSelect={() => onAddImage?.()}>
              <ImageIcon size={14} />
              {labels.imageOption}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </div>
  {/if}

  {#if imageUrl}
    <div class="ui:relative ui:group">
      <img src={imageUrl} alt="" class="ui:block ui:max-h-[280px] ui:w-full ui:rounded-xl ui:object-cover" />
      {#if editable}
        <IconButton
          size="icon-sm"
          tooltipClass="ui:absolute ui:top-2 ui:right-2 ui:opacity-0 ui:transition ui:group-hover:opacity-100 ui:focus-within:opacity-100"
          tooltip={labels.removeImage}
          aria-label={labels.removeImage}
          onclick={onRemoveImage}
        >
          <XIcon class="custom" />
        </IconButton>
      {/if}
    </div>
  {/if}

  {#if editable}
    <InlineText
      tag="h3"
      value={question}
      {editable}
      multiline
      placeholder={labels.questionPlaceholder}
      maxLength={questionMaxLength}
      class="ui:hover:bg-accent ui:focus-visible:bg-accent ui:-mx-2 ui:-my-[3px] ui:px-2 ui:py-[3px] ui:text-[22px] ui:leading-[1.35] ui:font-bold ui:tracking-[-.02em]"
      onInput={onQuestionInput}
    />

    <p class="ui:text-muted-foreground ui:-mt-2 ui:text-[13px]">{labels.editHint}</p>

    <div class="ui:flex ui:flex-col ui:gap-2.5">
      {#each options as option, index (option.id)}
        {@const isCorrect = option.id === correctOptionId}
        <div class={editRowClass(isCorrect)}>
          <button
            type="button"
            class={cn(
              'ui:grid ui:size-8 ui:shrink-0 ui:place-items-center ui:rounded-full ui:border-[1.5px] ui:p-0 ui:text-[13px] ui:font-bold ui:transition-all',
              isCorrect
                ? 'ui:border-success ui:bg-success ui:text-white'
                : 'ui:border-input ui:bg-background ui:text-muted-foreground ui:hover:scale-105 ui:hover:border-success ui:hover:text-success'
            )}
            aria-label={labels.markCorrect}
            aria-pressed={isCorrect}
            onclick={() => onMarkCorrect?.(option.id)}
          >
            {#if isCorrect}
              <CheckIcon size={15} strokeWidth={3} class="custom ui:text-white" />
            {:else}
              {optionLetter(index)}
            {/if}
          </button>

          <InlineText
            value={option.text}
            editable
            placeholder={labels.optionPlaceholder}
            maxLength={optionMaxLength}
            class="ui:hover:bg-foreground/[0.06] ui:focus-visible:bg-foreground/[0.06] ui:-mx-1.5 ui:-my-0.5 ui:min-w-0 ui:flex-1 ui:rounded-sm ui:px-1.5 ui:py-0.5 ui:text-[15.5px] ui:leading-[1.45] ui:font-medium"
            bind:ref={optionRefs[option.id]}
            onInput={(text) => onOptionInput?.(option.id, text)}
          />

          {#if isCorrect}
            <span
              class="ui:text-success ui:inline-flex ui:shrink-0 ui:items-center ui:gap-[5px] ui:text-[11.5px] ui:font-bold"
            >
              <CheckIcon size={13} strokeWidth={3} class="custom" />
              {labels.correctBadge}
            </span>
          {/if}

          <button
            type="button"
            class="ui:text-muted-foreground ui:hover:bg-destructive/10 ui:hover:text-destructive ui:grid ui:size-[26px] ui:shrink-0 ui:place-items-center ui:rounded-full ui:border-0 ui:bg-transparent ui:p-0 ui:opacity-0 ui:transition ui:group-hover:opacity-100 ui:focus-visible:opacity-100 ui:disabled:cursor-not-allowed"
            disabled={!canRemoveOption}
            aria-label={labels.removeOption}
            data-testid={testId ? `${testId}-remove-option` : undefined}
            onclick={() => onRemoveOption?.(option.id)}
          >
            <XIcon size={13} strokeWidth={2.4} class="custom" />
          </button>
        </div>
      {/each}

      {#if canAddOption}
        <button
          type="button"
          class="ui:border-border ui:text-muted-foreground ui:hover:border-primary ui:hover:bg-primary/5 ui:hover:text-primary ui:mt-1.5 ui:flex ui:w-full ui:items-center ui:justify-center ui:gap-1.5 ui:rounded-lg ui:border-[1.5px] ui:border-dashed ui:bg-transparent ui:p-[10px] ui:text-[12.5px] ui:font-semibold ui:transition"
          data-testid={testId ? `${testId}-add-option` : undefined}
          onclick={addOption}
        >
          <PlusIcon size={13} />
          {labels.addOption}
        </button>
      {/if}
    </div>
  {:else}
    <InlineText
      tag="h3"
      value={question}
      multiline
      class="ui:-mx-2 ui:-my-[3px] ui:px-2 ui:py-[3px] ui:text-[22px] ui:leading-[1.35] ui:font-bold ui:tracking-[-.02em]"
    />

    <p class="ui:text-muted-foreground ui:-mt-2 ui:text-[13px]">{labels.learnerHint}</p>

    <RadioGroup.Root value={selectedId} disabled={checked} onValueChange={selectOption} aria-label={question}>
      <div class="ui:flex ui:flex-col ui:gap-2.5">
        {#each options as option, index (option.id)}
          {@const optionId = `${groupId}-${option.id}`}
          {@const isSelected = option.id === selectedId}
          {@const isCorrect = option.id === correctOptionId}

          <div
            class={cn(
              'ui:flex ui:items-center ui:gap-3.5 ui:rounded-lg ui:border-[1.5px] ui:px-3.5 ui:py-3 ui:transition-colors',
              !checked && 'ui:cursor-pointer',
              reviewRowClass(isSelected, isCorrect)
            )}
          >
            <span
              class={cn(
                'ui:relative ui:grid ui:size-8 ui:shrink-0 ui:place-items-center ui:rounded-full ui:border-[1.5px] ui:text-[13px] ui:font-bold ui:focus-within:ring-2 ui:focus-within:ring-ring/50',
                reviewMarkClass(isSelected, isCorrect)
              )}
            >
              <RadioGroup.Item
                id={optionId}
                value={option.id}
                class="ui:absolute ui:inset-0 ui:size-full! ui:rounded-full ui:border-0! ui:bg-transparent! ui:opacity-0! ui:shadow-none! ui:ring-0!"
              />
              {#if checked && isCorrect}
                <CheckIcon size={15} strokeWidth={3} class="custom" />
              {:else if checked && isSelected}
                <XIcon size={15} strokeWidth={3} class="custom" />
              {:else}
                {optionLetter(index)}
              {/if}
            </span>

            <Label
              for={optionId}
              class="ui:w-full ui:flex-1 ui:cursor-pointer ui:text-[15.5px] ui:leading-[1.45] ui:font-medium"
            >
              {option.text}
            </Label>
          </div>
        {/each}
      </div>
    </RadioGroup.Root>

    <div class="ui:flex ui:flex-wrap ui:items-center ui:gap-3">
      {#if checked}
        <div
          class={cn(
            'ui:flex ui:min-w-0 ui:flex-1 ui:items-center ui:gap-2.5 ui:rounded-lg ui:px-3.5 ui:py-2.5 ui:text-sm ui:font-semibold',
            answeredCorrectly ? 'ui:bg-success/10 ui:text-success' : 'ui:bg-destructive/10 ui:text-destructive'
          )}
          role="status"
        >
          {#if answeredCorrectly}
            <CircleCheckIcon size={18} strokeWidth={2.4} class="custom" />
            {labels.correctFeedback}
          {:else}
            <CircleXIcon size={18} strokeWidth={2.4} class="custom" />
            {labels.wrongFeedback}
          {/if}
        </div>
      {/if}

      <div class="ui:ml-auto">
        {#if checked}
          <Button variant="outline" class="ui:min-w-[132px]" onclick={tryAgain}>{labels.tryAgain}</Button>
        {:else}
          <Button class="ui:min-w-[132px]" disabled={!selectedId} onclick={() => (checked = true)}
            >{labels.check}</Button
          >
        {/if}
      </div>
    </div>
  {/if}
</div>
