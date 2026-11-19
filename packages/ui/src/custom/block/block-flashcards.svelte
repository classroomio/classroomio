<script lang="ts">
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import RotateCwIcon from '@lucide/svelte/icons/rotate-cw';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { tick } from 'svelte';
  import { Badge } from '../../base/badge';
  import * as Pagination from '../../base/pagination';
  import { Progress } from '../../base/progress';
  import { cn } from '../../tools';
  import { IconButton } from '../icon-button';
  import InlineText from './block-inline-text.svelte';
  import type { FlashcardsBlockCard, FlashcardsBlockLabels } from './types';

  interface Props {
    cards: FlashcardsBlockCard[];
    editable?: boolean;
    maxCards?: number;
    textMaxLength?: number;
    labels: FlashcardsBlockLabels;
    testId?: string;
    onQuestionInput?: (cardId: string, question: string) => void;
    onAnswerInput?: (cardId: string, answer: string) => void;
    onAddCard?: () => void;
    onRemoveCard?: (cardId: string) => void;
  }

  let {
    cards,
    editable = false,
    maxCards = 100,
    textMaxLength,
    labels,
    testId,
    onQuestionInput,
    onAnswerInput,
    onAddCard,
    onRemoveCard
  }: Props = $props();

  let requestedIndex = $state(0);
  let flipped = $state(false);
  let questionRef = $state<HTMLElement | null>();

  const currentIndex = $derived(Math.min(requestedIndex, Math.max(cards.length - 1, 0)));
  const currentCard = $derived(cards[currentIndex]);
  const isFirst = $derived(currentIndex === 0);
  const isLast = $derived(currentIndex >= cards.length - 1);
  const progress = $derived(cards.length ? ((currentIndex + 1) / cards.length) * 100 : 0);
  const canAddCard = $derived(cards.length < maxCards);
  const canRemoveCard = $derived(cards.length > 1);

  function showCard(index: number) {
    if (index < 0 || index >= cards.length) return;

    requestedIndex = index;
    flipped = false;
  }

  function flip() {
    flipped = !flipped;
  }

  async function addCard() {
    const knownIds = new Set(cards.map((card) => card.id));
    onAddCard?.();
    await tick();

    const addedIndex = cards.findIndex((card) => !knownIds.has(card.id));
    if (addedIndex === -1) return;

    showCard(addedIndex);
    await tick();
    questionRef?.focus();
  }

  /** Removes the card on screen and shows the one before it, or the next one when it was the first. */
  function removeCard(cardId: string) {
    if (!canRemoveCard) return;

    onRemoveCard?.(cardId);
    requestedIndex = Math.max(currentIndex - 1, 0);
    flipped = false;
  }

  function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;

    return target.isContentEditable || target.closest('[data-slot="pagination"]') !== null;
  }

  function handleBlockKeydown(event: KeyboardEvent) {
    if (isTypingTarget(event.target)) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showCard(currentIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      showCard(currentIndex + 1);
    }
  }

  function handleCardKeydown(event: KeyboardEvent) {
    if (event.target !== event.currentTarget) return;
    if (event.key !== ' ' && event.key !== 'Enter') return;

    event.preventDefault();
    flip();
  }

  const cardClass =
    'ui:group/card ui:relative ui:z-[1] ui:aspect-[16/10] ui:min-h-[232px] ui:outline-none ui:perspective-[1500px] ui:max-[560px]:aspect-auto ui:max-[560px]:min-h-[250px]';

  const faceClass =
    'ui:absolute ui:inset-0 ui:box-border ui:flex ui:flex-col ui:items-center ui:justify-center ui:gap-3.5 ui:rounded-xl ui:px-12 ui:pt-10 ui:pb-11 ui:text-center ui:shadow-lg ui:backface-hidden ui:max-[560px]:px-[22px] ui:max-[560px]:pt-[30px] ui:max-[560px]:pb-[34px]';

  const tagClass =
    "ui:inline-flex ui:items-center ui:gap-[7px] ui:text-[11px] ui:font-bold ui:tracking-[.14em] ui:uppercase ui:before:h-0.5 ui:before:w-4 ui:before:rounded-xs ui:before:bg-current ui:before:opacity-60 ui:before:content-[''] ui:after:h-0.5 ui:after:w-4 ui:after:rounded-xs ui:after:bg-current ui:after:opacity-60 ui:after:content-['']";

  const textClass =
    'ui:box-border ui:max-h-full ui:w-full ui:overflow-y-auto ui:rounded-sm ui:px-2 ui:py-1 ui:[scrollbar-width:none]';

  const editableTextClass =
    'ui:min-w-[60%] ui:bg-current/[0.04] ui:outline-[1.5px] ui:outline-offset-2 ui:outline-current/40 ui:outline-dashed ui:hover:bg-current/[0.06] ui:focus-visible:bg-current/[0.08] ui:focus-visible:outline-solid ui:focus-visible:ring-0';
</script>

{#snippet cardActions(card: FlashcardsBlockCard, onBack: boolean)}
  {@const actionClass = cn(
    'ui:size-8 ui:rounded-full ui:transition-[background-color,color,transform] ui:duration-300 ui:[&_svg]:size-[15px]',
    onBack
      ? 'ui:bg-white/15 ui:text-primary-foreground/85 ui:hover:bg-white/30 ui:hover:text-primary-foreground'
      : 'ui:bg-foreground/5 ui:text-muted-foreground'
  )}
  {@const flipClass = cn(
    actionClass,
    'ui:hover:rotate-180 ui:motion-reduce:hover:rotate-0',
    !onBack && 'ui:hover:bg-primary/15 ui:hover:text-primary'
  )}
  {#if editable}
    <div class="ui:absolute ui:top-3.5 ui:right-3.5 ui:flex ui:items-center ui:gap-1.5">
      {#if canRemoveCard}
        <IconButton
          size="icon-sm"
          class={cn(actionClass, !onBack && 'ui:hover:bg-destructive/15 ui:hover:text-destructive')}
          tooltip={labels.removeCard}
          aria-label={labels.removeCard}
          testId={testId ? `${testId}-remove` : undefined}
          onclick={() => removeCard(card.id)}
        >
          <Trash2Icon strokeWidth={2.2} />
        </IconButton>
      {/if}
      <IconButton size="icon-sm" class={flipClass} tooltip={labels.flip} aria-label={labels.flip} onclick={flip}>
        <RotateCwIcon strokeWidth={2.2} />
      </IconButton>
    </div>
  {:else}
    <IconButton
      size="icon-sm"
      class={cn('ui:absolute ui:top-3.5 ui:right-3.5', flipClass)}
      tabindex={-1}
      aria-hidden="true"
    >
      <RotateCwIcon strokeWidth={2.2} />
    </IconButton>
  {/if}
{/snippet}

{#snippet cardFaces(card: FlashcardsBlockCard)}
  <div
    class={cn(
      'ui:absolute ui:inset-0 ui:transition-transform ui:duration-[650ms] ui:ease-[cubic-bezier(.45,.15,.2,1)] ui:transform-3d ui:motion-reduce:transition-none',
      flipped && 'ui:rotate-y-180'
    )}
  >
    <div
      class={cn(
        faceClass,
        'ui:border-primary/20 ui:from-card ui:border ui:bg-linear-160 ui:from-30% ui:to-[color-mix(in_oklab,var(--primary)_9%,var(--card))]',
        'ui:group-focus-visible/card:ring-ring/60 ui:group-focus-visible/card:ring-[3px]'
      )}
      inert={flipped}
    >
      {@render cardActions(card, false)}
      <span class={cn(tagClass, 'ui:text-primary')}>{labels.question}</span>
      <InlineText
        tag="div"
        value={card.question}
        {editable}
        multiline
        placeholder={labels.questionPlaceholder}
        maxLength={textMaxLength}
        class={cn(
          textClass,
          'ui:text-[clamp(18px,2.6vw,25px)] ui:leading-[1.38] ui:font-[650] ui:tracking-[-.015em]',
          editable && editableTextClass,
          editable && 'ui:hover:outline-primary ui:focus-visible:outline-primary'
        )}
        testId={testId ? `${testId}-question` : undefined}
        bind:ref={questionRef}
        onInput={(question) => onQuestionInput?.(card.id, question)}
      />
      {#if !editable}
        <span
          class="ui:text-muted-foreground ui:pointer-events-none ui:absolute ui:right-0 ui:bottom-3.5 ui:left-0 ui:text-[11.5px] ui:font-medium ui:opacity-85"
        >
          {labels.flipHint}
        </span>
      {/if}
    </div>

    <div
      class={cn(
        faceClass,
        'ui:text-primary-foreground ui:rotate-y-180 ui:bg-[linear-gradient(150deg,color-mix(in_oklab,var(--primary)_88%,white)_0%,var(--primary)_45%,color-mix(in_oklab,var(--primary)_72%,black)_100%)]',
        'ui:group-focus-visible/card:ring-ring/60 ui:group-focus-visible/card:ring-[3px]'
      )}
      inert={!flipped}
    >
      {@render cardActions(card, true)}
      <span class={cn(tagClass, 'ui:text-primary-foreground/80')}>{labels.answer}</span>
      <InlineText
        tag="div"
        value={card.answer}
        {editable}
        multiline
        placeholder={labels.answerPlaceholder}
        maxLength={textMaxLength}
        class={cn(
          textClass,
          'ui:text-[clamp(16px,2.2vw,21px)] ui:leading-normal ui:font-medium',
          editable && editableTextClass,
          editable && 'ui:empty:before:text-primary-foreground/60'
        )}
        testId={testId ? `${testId}-answer` : undefined}
        onInput={(answer) => onAnswerInput?.(card.id, answer)}
      />
    </div>
  </div>
{/snippet}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="ui:flex ui:flex-col ui:items-center ui:gap-[22px]" data-testid={testId} onkeydown={handleBlockKeydown}>
  {#if editable}
    <Badge
      variant="outline"
      class="ui:border-primary/25 ui:bg-primary/[0.09] ui:text-primary ui:h-auto ui:gap-[7px] ui:rounded-full ui:px-3 ui:py-1.5 ui:text-xs ui:font-semibold ui:whitespace-normal ui:[&>svg]:size-3.5"
    >
      <PencilIcon strokeWidth={2.2} class="custom" />
      {labels.editHint}
    </Badge>
  {/if}

  {#if currentCard}
    <div class="ui:relative ui:mb-3.5 ui:w-full ui:max-w-[580px]">
      <div
        aria-hidden="true"
        class="ui:bg-card ui:border-border ui:absolute ui:inset-0 ui:translate-y-[14px] ui:scale-[.93] ui:rounded-xl ui:border ui:opacity-55 ui:shadow-sm"
      ></div>
      <div
        aria-hidden="true"
        class="ui:bg-card ui:border-border ui:absolute ui:inset-0 ui:translate-y-[7px] ui:scale-[.965] ui:rounded-xl ui:border ui:opacity-85 ui:shadow-sm"
      ></div>

      {#if editable}
        <div class={cardClass} data-flipped={flipped} data-testid={testId ? `${testId}-card` : undefined}>
          {@render cardFaces(currentCard)}
        </div>
      {:else}
        <div
          class={cn(cardClass, 'ui:cursor-pointer')}
          role="button"
          tabindex="0"
          aria-label={flipped ? labels.showQuestion : labels.showAnswer}
          data-flipped={flipped}
          data-testid={testId ? `${testId}-card` : undefined}
          onclick={flip}
          onkeydown={handleCardKeydown}
        >
          {@render cardFaces(currentCard)}
        </div>
      {/if}
    </div>

    <div class="ui:flex ui:w-full ui:max-w-[580px] ui:items-center ui:gap-4">
      <IconButton
        class="ui:size-[38px] ui:shrink-0 ui:rounded-full ui:[&_svg]:size-[17px] ui:border-border ui:border"
        tooltip={labels.previous}
        aria-label={labels.previous}
        disabled={isFirst}
        onclick={() => showCard(currentIndex - 1)}
      >
        <ChevronLeftIcon strokeWidth={2.3} />
      </IconButton>

      <div class="ui:flex ui:min-w-0 ui:flex-1 ui:flex-col ui:items-center ui:gap-2">
        <span class="ui:text-muted-foreground ui:text-[12.5px] ui:font-semibold ui:tabular-nums" aria-live="polite">
          <b class="ui:text-foreground ui:font-bold">{currentIndex + 1}</b> / {cards.length}
        </span>
        <Progress
          value={progress}
          aria-label={labels.progress}
          class="ui:h-1 ui:rounded-full ui:[&>[data-slot=progress-indicator]]:duration-[350ms]"
        />
      </div>

      <IconButton
        class="ui:size-[38px] ui:shrink-0 ui:rounded-full ui:[&_svg]:size-[17px] ui:border-border ui:border"
        tooltip={labels.next}
        aria-label={labels.next}
        disabled={isLast}
        onclick={() => showCard(currentIndex + 1)}
      >
        <ChevronRightIcon strokeWidth={2.3} />
      </IconButton>
    </div>

    {#if editable}
      <div class="ui:border-border ui:w-full ui:border-t ui:pt-[18px]">
        <Pagination.Root
          count={cards.length}
          perPage={1}
          page={currentIndex + 1}
          siblingCount={cards.length}
          class="ui:justify-start"
          aria-label={labels.cards}
          onPageChange={(page) => showCard(page - 1)}
        >
          {#snippet children({ pages, currentPage })}
            <Pagination.Content class="ui:flex-wrap ui:gap-1.5">
              {#each pages as pageItem (pageItem.key)}
                {#if pageItem.type === 'page'}
                  <Pagination.Item>
                    <Pagination.Link
                      page={pageItem}
                      size="icon-sm"
                      class="ui:shadow-none ui:hover:shadow-none"
                      isActive={currentPage === pageItem.value}
                    >
                      {pageItem.value}
                    </Pagination.Link>
                  </Pagination.Item>
                {/if}
              {/each}
              {#if canAddCard}
                <Pagination.Item>
                  <IconButton
                    size="icon-sm"
                    class="ui:shadow-none"
                    tooltip={labels.addCard}
                    aria-label={labels.addCard}
                    testId={testId ? `${testId}-add` : undefined}
                    onclick={addCard}
                  >
                    <PlusIcon strokeWidth={2.4} />
                  </IconButton>
                </Pagination.Item>
              {/if}
            </Pagination.Content>
          {/snippet}
        </Pagination.Root>
      </div>
    {/if}
  {/if}
</div>
