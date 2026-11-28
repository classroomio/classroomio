<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { FLASHCARD_TEXT_MAX_LENGTH, FLASHCARDS_MAX_CARDS } from '@cio/utils/validation/block';
  import type { BlockEditProps } from '../../utils/types';
  import { getFlashcardsLabels } from './flashcards-labels';
  import { addCard, removeCard, setCardAnswer, setCardQuestion } from './flashcards-utils';

  let { block, onDataChange }: BlockEditProps<'flashcards'> = $props();
</script>

<Block.Flashcards
  editable
  cards={block.data.cards}
  maxCards={FLASHCARDS_MAX_CARDS}
  textMaxLength={FLASHCARD_TEXT_MAX_LENGTH}
  labels={getFlashcardsLabels()}
  testId="block-flashcards-edit"
  onQuestionInput={(cardId, question) => onDataChange(setCardQuestion(block.data, cardId, question))}
  onAnswerInput={(cardId, answer) => onDataChange(setCardAnswer(block.data, cardId, answer))}
  onAddCard={() => onDataChange(addCard(block.data))}
  onRemoveCard={(cardId) => onDataChange(removeCard(block.data, cardId))}
/>
