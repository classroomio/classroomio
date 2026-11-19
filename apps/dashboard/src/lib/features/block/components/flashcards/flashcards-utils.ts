import { FLASHCARDS_MAX_CARDS, FLASHCARDS_MIN_CARDS, type TFlashcardsBlockData } from '@cio/utils/validation/block';

export interface FlashcardExampleCopy {
  question: string;
  answer: string;
}

export function createCardId(): string {
  return crypto.randomUUID();
}

/**
 * The deck a menu click inserts, one card per example.
 */
export function createExampleFlashcards(copy: FlashcardExampleCopy[]): TFlashcardsBlockData {
  const cards = copy.map((example) => ({ id: createCardId(), question: example.question, answer: example.answer }));

  return { cards };
}

export function setCardQuestion(data: TFlashcardsBlockData, cardId: string, question: string): TFlashcardsBlockData {
  const cards = data.cards.map((card) => (card.id === cardId ? { ...card, question } : card));

  return { ...data, cards };
}

export function setCardAnswer(data: TFlashcardsBlockData, cardId: string, answer: string): TFlashcardsBlockData {
  const cards = data.cards.map((card) => (card.id === cardId ? { ...card, answer } : card));

  return { ...data, cards };
}

/**
 * Appends an empty card. The deck is returned unchanged once it holds the maximum.
 */
export function addCard(data: TFlashcardsBlockData): TFlashcardsBlockData {
  if (data.cards.length >= FLASHCARDS_MAX_CARDS) return data;

  const card = { id: createCardId(), question: '', answer: '' };

  return { ...data, cards: [...data.cards, card] };
}

/**
 * Removes one card. The deck is returned unchanged when it is already at the minimum.
 */
export function removeCard(data: TFlashcardsBlockData, cardId: string): TFlashcardsBlockData {
  if (data.cards.length <= FLASHCARDS_MIN_CARDS) return data;

  const cards = data.cards.filter((card) => card.id !== cardId);

  return { ...data, cards };
}
