import { describe, expect, it } from 'vitest';
import { FLASHCARDS_MAX_CARDS, ZFlashcardsBlockData } from '@cio/utils/validation/block';
import { addCard, createExampleFlashcards, removeCard, setCardAnswer, setCardQuestion } from './flashcards-utils';

const EXAMPLES = [
  { question: 'What is retention?', answer: 'Keeping customers.' },
  { question: 'Why does it matter?', answer: 'It is cheaper.' }
];

describe('flashcards utils', () => {
  it('creates a valid example deck with one card per example', () => {
    const deck = createExampleFlashcards(EXAMPLES);

    expect(deck.cards.map((card) => card.question)).toEqual(['What is retention?', 'Why does it matter?']);
    expect(ZFlashcardsBlockData.safeParse(deck).success).toBe(true);
  });

  it('edits only the targeted card side', () => {
    const deck = createExampleFlashcards(EXAMPLES);
    const [first, second] = deck.cards;

    const withQuestion = setCardQuestion(deck, first.id, 'Edited');
    const withAnswer = setCardAnswer(withQuestion, second.id, 'New answer');

    expect(withAnswer.cards[0]).toEqual({ ...first, question: 'Edited' });
    expect(withAnswer.cards[1]).toEqual({ ...second, answer: 'New answer' });
  });

  it('appends an empty card with a new id', () => {
    const deck = createExampleFlashcards(EXAMPLES);

    const next = addCard(deck);

    expect(next.cards).toHaveLength(3);
    expect(next.cards[2]).toMatchObject({ question: '', answer: '' });
    expect(new Set(next.cards.map((card) => card.id)).size).toBe(3);
  });

  it('stops adding at the maximum', () => {
    const full = createExampleFlashcards(
      Array.from({ length: FLASHCARDS_MAX_CARDS }, () => ({ question: 'Q', answer: 'A' }))
    );

    expect(addCard(full)).toBe(full);
  });

  it('removes only the targeted card', () => {
    const deck = createExampleFlashcards(EXAMPLES);
    const [first, second] = deck.cards;

    expect(removeCard(deck, first.id).cards).toEqual([second]);
  });

  it('keeps the last remaining card', () => {
    const single = createExampleFlashcards(EXAMPLES.slice(0, 1));

    expect(removeCard(single, single.cards[0].id)).toBe(single);
  });
});
