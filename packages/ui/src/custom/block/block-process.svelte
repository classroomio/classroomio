<script lang="ts">
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import ImageIcon from '@lucide/svelte/icons/image';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import XIcon from '@lucide/svelte/icons/x';
  import { tick } from 'svelte';
  import { Button } from '../../base/button';
  import * as DropdownMenu from '../../base/dropdown-menu';
  import { Progress } from '../../base/progress';
  import { cn } from '../../tools';
  import { IconButton } from '../icon-button';
  import InlineText from './block-inline-text.svelte';
  import type { ProcessBlockLabels, ProcessBlockStep } from './types';

  interface Props {
    steps: ProcessBlockStep[];
    editable?: boolean;
    maxSteps?: number;
    headingMaxLength?: number;
    bodyMaxLength?: number;
    labels: ProcessBlockLabels;
    testId?: string;
    onHeadingInput?: (stepId: string, heading: string) => void;
    onBodyInput?: (stepId: string, body: string) => void;
    onAddStep?: () => void;
    onRemoveStep?: (stepId: string) => void;
    onAddImage?: (stepId: string) => void;
    onRemoveImage?: (stepId: string) => void;
  }

  let {
    steps,
    editable = false,
    maxSteps = 20,
    headingMaxLength,
    bodyMaxLength,
    labels,
    testId,
    onHeadingInput,
    onBodyInput,
    onAddStep,
    onRemoveStep,
    onAddImage,
    onRemoveImage
  }: Props = $props();

  let requestedIndex = $state(0);
  let headingRef = $state<HTMLElement | null>();

  const currentIndex = $derived(Math.min(requestedIndex, Math.max(steps.length - 1, 0)));
  const currentStep = $derived(steps[currentIndex]);
  const isFirst = $derived(currentIndex === 0);
  const isLast = $derived(currentIndex >= steps.length - 1);
  const progress = $derived(steps.length ? ((currentIndex + 1) / steps.length) * 100 : 0);
  const canAddStep = $derived(steps.length < maxSteps);
  const canRemoveStep = $derived(steps.length > 1);

  function showStep(index: number) {
    if (index < 0 || index >= steps.length) return;

    requestedIndex = index;
  }

  function advance() {
    showStep(isLast ? 0 : currentIndex + 1);
  }

  async function addStep() {
    const knownIds = new Set(steps.map((step) => step.id));
    onAddStep?.();
    await tick();

    const addedIndex = steps.findIndex((step) => !knownIds.has(step.id));
    if (addedIndex === -1) return;

    showStep(addedIndex);
    await tick();
    headingRef?.focus();
  }

  /** Removes the step on screen and shows the one before it, or the next one when it was the first. */
  function removeStep() {
    if (!canRemoveStep || !currentStep) return;

    const removedIndex = currentIndex;
    onRemoveStep?.(currentStep.id);
    requestedIndex = Math.max(removedIndex - 1, 0);
  }

  function nodeClass(index: number): string {
    if (index < currentIndex) return 'ui:border-primary ui:bg-primary ui:text-primary-foreground';
    if (index === currentIndex) {
      return 'ui:border-primary ui:bg-card ui:text-primary ui:ring-[5px] ui:ring-primary/15';
    }

    return 'ui:border-border ui:bg-card ui:text-muted-foreground ui:group-hover/step:border-primary/60';
  }

  const editableTextClass =
    'ui:-mx-2 ui:-my-[3px] ui:px-2 ui:py-[3px] ui:hover:bg-accent ui:focus-visible:bg-accent ui:focus-visible:ring-0';
</script>

<div class="ui:@container ui:flex ui:flex-col ui:gap-6" data-testid={testId}>
  <div class="ui:flex ui:min-h-[30px] ui:items-center ui:justify-between ui:gap-2.5">
    {#if editable && currentStep}
      <div class="ui:bg-muted ui:flex ui:items-center ui:gap-0.5 ui:rounded-full ui:p-[3px] ui:ml-auto">
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
            <DropdownMenu.Item onSelect={() => onAddImage?.(currentStep.id)}>
              <ImageIcon size={14} />
              {labels.imageOption}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        <span class="ui:bg-border ui:mx-0.5 ui:h-4 ui:w-px" aria-hidden="true"></span>
        <button
          type="button"
          class="ui:text-foreground ui:hover:bg-card ui:hover:text-destructive ui:flex ui:size-[26px] ui:items-center ui:justify-center ui:rounded-full ui:p-0 ui:transition ui:disabled:pointer-events-none ui:disabled:opacity-40"
          aria-label={labels.deleteStep}
          title={labels.deleteStep}
          disabled={!canRemoveStep}
          data-testid={testId ? `${testId}-delete` : undefined}
          onclick={removeStep}
        >
          <Trash2Icon size={13} />
        </button>
      </div>
    {/if}
  </div>

  <ol class="ui:-m-1.5 ui:flex ui:list-none ui:items-start ui:overflow-x-auto ui:p-1.5" aria-label={labels.stepper}>
    {#each steps as step, index (step.id)}
      {@const isLastStep = index === steps.length - 1}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
      <li
        class={cn(
          'ui:group/step ui:flex ui:min-w-11 ui:cursor-pointer ui:flex-col ui:gap-[9px]',
          isLastStep ? 'ui:max-w-[40%] ui:flex-[0_1_auto] ui:@max-[560px]:max-w-none' : 'ui:flex-[1_1_0]'
        )}
        onclick={() => showStep(index)}
      >
        <div class="ui:flex ui:items-center">
          <button
            type="button"
            class={cn(
              'ui:grid ui:size-8 ui:shrink-0 ui:place-items-center ui:rounded-full ui:border-2 ui:p-0 ui:text-[13px] ui:font-bold ui:transition-[background-color,border-color,color,box-shadow]',
              nodeClass(index)
            )}
            aria-label={labels.goToStep(index + 1)}
            aria-current={index === currentIndex ? 'step' : undefined}
            data-testid={testId ? `${testId}-node-${index + 1}` : undefined}
          >
            {#if index < currentIndex}
              <CheckIcon size={15} strokeWidth={3} class="custom" />
            {:else}
              {index + 1}
            {/if}
          </button>
          {#if !isLastStep}
            <span
              class={cn(
                'ui:mx-2.5 ui:h-[3px] ui:min-w-2 ui:flex-1 ui:rounded-[3px] ui:transition-colors',
                index < currentIndex ? 'ui:bg-primary' : 'ui:bg-border'
              )}
            ></span>
          {/if}
        </div>
        <span
          class={cn(
            'ui:truncate ui:pr-3 ui:text-[12.5px] ui:leading-[1.3] ui:transition-colors ui:@max-[560px]:hidden',
            index === currentIndex ? 'ui:text-foreground ui:font-[650]' : 'ui:text-muted-foreground ui:font-medium'
          )}
        >
          {step.heading || labels.untitledStep}
        </span>
      </li>
    {/each}
  </ol>

  {#if currentStep}
    <div
      class={cn(
        'ui:grid ui:items-center ui:gap-[26px]',
        currentStep.imageUrl
          ? 'ui:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] ui:@max-[560px]:grid-cols-1 ui:@max-[560px]:gap-[18px]'
          : 'ui:grid-cols-1'
      )}
    >
      {#if currentStep.imageUrl}
        <div class="ui:group/media ui:relative">
          <img
            src={currentStep.imageUrl}
            alt=""
            class="ui:block ui:aspect-[4/3] ui:w-full ui:rounded-xl ui:object-cover"
          />
          {#if editable}
            <IconButton
              size="icon-sm"
              tooltipClass="ui:absolute ui:top-2.5 ui:right-2.5 ui:opacity-0 ui:transition ui:group-hover/media:opacity-100 ui:focus-within:opacity-100"
              tooltip={labels.removeImage}
              aria-label={labels.removeImage}
              testId={testId ? `${testId}-remove-image` : undefined}
              onclick={() => onRemoveImage?.(currentStep.id)}
            >
              <XIcon />
            </IconButton>
          {/if}
        </div>
      {/if}

      <div class={cn('ui:flex ui:min-w-0 ui:flex-col ui:gap-3', !currentStep.imageUrl && 'ui:max-w-[64ch]')}>
        <InlineText
          tag="h3"
          value={currentStep.heading}
          {editable}
          placeholder={labels.headingPlaceholder}
          maxLength={headingMaxLength}
          class={cn(
            'ui:m-0 ui:text-[26px] ui:leading-[1.22] ui:font-bold ui:tracking-[-.025em] ui:@max-[560px]:text-[22px]',
            editable && editableTextClass
          )}
          testId={testId ? `${testId}-heading` : undefined}
          bind:ref={headingRef}
          onInput={(heading) => onHeadingInput?.(currentStep.id, heading)}
        />
        <InlineText
          tag="p"
          value={currentStep.body}
          {editable}
          multiline
          placeholder={labels.bodyPlaceholder}
          maxLength={bodyMaxLength}
          class={cn('ui:text-foreground/85 ui:m-0 ui:text-[15.5px] ui:leading-[1.72]', editable && editableTextClass)}
          testId={testId ? `${testId}-body` : undefined}
          onInput={(body) => onBodyInput?.(currentStep.id, body)}
        />
      </div>
    </div>

    <div class="ui:border-border ui:flex ui:items-center ui:gap-[18px] ui:border-t ui:pt-[18px]">
      <Button
        variant="outline"
        size="sm"
        disabled={isFirst}
        testId={testId ? `${testId}-back` : undefined}
        onclick={() => showStep(currentIndex - 1)}
      >
        <ChevronLeftIcon strokeWidth={2.4} />
        {labels.back}
      </Button>
      <Progress
        value={progress}
        aria-label={labels.progress}
        class="ui:bg-muted ui:h-1 ui:flex-1 ui:rounded-full ui:[&>[data-slot=progress-indicator]]:duration-[350ms]"
      />
      <Button size="sm" testId={testId ? `${testId}-next` : undefined} onclick={advance}>
        {#if isLast}
          <RotateCcwIcon strokeWidth={2.4} />
          {labels.startOver}
        {:else}
          {labels.next}
          <ChevronRightIcon strokeWidth={2.4} />
        {/if}
      </Button>
    </div>
  {/if}

  {#if editable && canAddStep}
    <button
      type="button"
      class="ui:border-border ui:text-muted-foreground ui:hover:border-primary ui:hover:bg-primary/5 ui:hover:text-primary ui:-mt-1.5 ui:flex ui:w-full ui:items-center ui:justify-center ui:gap-1.5 ui:rounded-lg ui:border-[1.5px] ui:border-dashed ui:bg-transparent ui:p-[10px] ui:text-[12.5px] ui:font-semibold ui:transition"
      data-testid={testId ? `${testId}-add` : undefined}
      onclick={addStep}
    >
      <PlusIcon size={14} />
      {labels.addStep}
    </button>
  {/if}
</div>
