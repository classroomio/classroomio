import type { FlashcardsBlockLabels } from '@cio/ui/custom/block';
import { t } from '$lib/utils/functions/translations';
import type { FlashcardExampleCopy } from './flashcards-utils';

const KEY = 'course.navItem.lessons.materials.blocks.flashcards';

export function getFlashcardsLabels(): FlashcardsBlockLabels {
  return {
    editHint: t.get(`${KEY}.edit_hint`),
    flipHint: t.get(`${KEY}.flip_hint`),
    question: t.get(`${KEY}.question`),
    answer: t.get(`${KEY}.answer`),
    questionPlaceholder: t.get(`${KEY}.question_placeholder`),
    answerPlaceholder: t.get(`${KEY}.answer_placeholder`),
    flip: t.get(`${KEY}.flip`),
    showQuestion: t.get(`${KEY}.show_question`),
    showAnswer: t.get(`${KEY}.show_answer`),
    previous: t.get(`${KEY}.previous`),
    next: t.get(`${KEY}.next`),
    progress: t.get(`${KEY}.progress`),
    cards: t.get(`${KEY}.cards`),
    addCard: t.get(`${KEY}.add_card`),
    removeCard: t.get(`${KEY}.remove_card`)
  };
}

export function getFlashcardsExampleCopy(): FlashcardExampleCopy[] {
  return [1, 2, 3].map((number) => ({
    question: t.get(`${KEY}.example.question_${number}`),
    answer: t.get(`${KEY}.example.answer_${number}`)
  }));
}
