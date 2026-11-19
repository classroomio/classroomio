import * as z from 'zod';

import { defineBlock, ZBlockItemId } from '../definition';

export const FLASHCARDS_MIN_CARDS = 1;
export const FLASHCARDS_MAX_CARDS = 100;
export const FLASHCARD_TEXT_MAX_LENGTH = 1000;

export const ZFlashcard = z.object({
  id: ZBlockItemId,
  question: z.string().max(FLASHCARD_TEXT_MAX_LENGTH),
  answer: z.string().max(FLASHCARD_TEXT_MAX_LENGTH)
});
export type TFlashcard = z.infer<typeof ZFlashcard>;

export const ZFlashcardsBlockData = z
  .object({
    cards: z.array(ZFlashcard).min(FLASHCARDS_MIN_CARDS).max(FLASHCARDS_MAX_CARDS)
  })
  .refine((data) => new Set(data.cards.map((card) => card.id)).size === data.cards.length, {
    message: 'Card ids must be unique',
    path: ['cards']
  });
export type TFlashcardsBlockData = z.infer<typeof ZFlashcardsBlockData>;

export const flashcardsBlock = defineBlock({
  key: 'flashcards',
  dataSchema: ZFlashcardsBlockData,
  localizedContent: false,
  media: null,
  toPublicData: (data) => data,
  agentEditableFields: [],
  agent: {
    purpose:
      'Flip cards with a question or term on the front and the answer on the back, for recall practice. Nothing is graded or saved.',
    inputSchema: ZFlashcardsBlockData,
    toInput: (data) => data,
    fromInput: (input) => input
  }
});
