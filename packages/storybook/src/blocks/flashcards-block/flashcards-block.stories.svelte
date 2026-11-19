<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Block from '@cio/ui/custom/block';
  import type { FlashcardsBlockCard, FlashcardsBlockLabels } from '@cio/ui/custom/block';
  import { FIELDS } from './fields';

  const LABELS: FlashcardsBlockLabels = {
    editHint: 'Click any text on the card to edit it · use the flip button to edit the answer side',
    flipHint: 'Click the card to flip',
    question: 'Question',
    answer: 'Answer',
    questionPlaceholder: 'Type the question',
    answerPlaceholder: 'Type the answer',
    flip: 'Flip card',
    showQuestion: 'Flashcard showing the answer. Press Space to see the question.',
    showAnswer: 'Flashcard showing the question. Press Space to see the answer.',
    previous: 'Previous card',
    next: 'Next card',
    progress: 'Deck progress',
    cards: 'Cards',
    addCard: 'Add card',
    removeCard: 'Remove card'
  };

  const CARDS: FlashcardsBlockCard[] = [
    {
      id: 'retention',
      question: 'What is customer retention?',
      answer: 'The ability of a business to keep its customers over time.'
    },
    {
      id: 'why',
      question: 'Why does retention matter more than acquisition?',
      answer: "It's typically 5–7× cheaper to keep an existing customer than to win a new one."
    },
    {
      id: 'measure',
      question: 'What is a simple way to measure it?',
      answer: 'Compare how many customers you had at the start of a period to how many remain at the end.'
    }
  ];

  const LONG_DECK: FlashcardsBlockCard[] = Array.from({ length: 24 }, (_, index) => ({
    id: `card-${index + 1}`,
    question: `Question ${index + 1}`,
    answer: `Answer ${index + 1}`
  }));

  const { Story } = defineMeta({
    title: 'Blocks/FlashcardsBlock',
    component: Block.Flashcards,
    args: {
      cards: CARDS,
      editable: false,
      maxCards: 100,
      labels: LABELS
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onQuestionInput: { control: false },
      onAnswerInput: { control: false },
      onAddCard: { control: false },
      onRemoveCard: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let editCards = $state<FlashcardsBlockCard[]>([...CARDS]);
  let nextCardNumber = 1;

  function updateCard(cardId: string, field: 'question' | 'answer', text: string) {
    editCards = editCards.map((card) => (card.id === cardId ? { ...card, [field]: text } : card));
  }

  function addCard() {
    editCards = [...editCards, { id: `new-${nextCardNumber}`, question: '', answer: '' }];
    nextCardNumber += 1;
  }
</script>

<Story name="Learner">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl py-4">
      <Block.Flashcards {...args} />
    </div>
  {/snippet}
</Story>

<Story name="LearnerSingleCard">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl py-4">
      <Block.Flashcards {...args} cards={CARDS.slice(0, 1)} />
    </div>
  {/snippet}
</Story>

<Story name="Edit">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl py-4">
      <Block.Flashcards
        {...args}
        editable
        cards={editCards}
        onQuestionInput={(cardId, text) => updateCard(cardId, 'question', text)}
        onAnswerInput={(cardId, text) => updateCard(cardId, 'answer', text)}
        onAddCard={addCard}
        onRemoveCard={(cardId) => (editCards = editCards.filter((card) => card.id !== cardId))}
      />
    </div>
  {/snippet}
</Story>

<Story name="EditEmptyCard">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl py-4">
      <Block.Flashcards {...args} editable cards={[{ id: 'empty', question: '', answer: '' }]} />
    </div>
  {/snippet}
</Story>

<Story name="EditLongDeck">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl py-4">
      <Block.Flashcards {...args} editable cards={LONG_DECK} />
    </div>
  {/snippet}
</Story>

<Story name="EditAtMaximumCards">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl py-4">
      <Block.Flashcards {...args} editable maxCards={3} />
    </div>
  {/snippet}
</Story>
