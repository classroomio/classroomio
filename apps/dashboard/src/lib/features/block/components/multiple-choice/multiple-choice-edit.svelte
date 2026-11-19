<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import {
    MULTIPLE_CHOICE_MAX_OPTIONS,
    MULTIPLE_CHOICE_MIN_OPTIONS,
    MULTIPLE_CHOICE_OPTION_MAX_LENGTH,
    MULTIPLE_CHOICE_QUESTION_MAX_LENGTH
  } from '@cio/utils/validation/block';
  import type { BlockEditProps } from '../../utils/types';
  import { getMultipleChoiceLabels, getNewOptionText } from './multiple-choice-labels';
  import {
    addOption,
    markCorrectOption,
    removeOption,
    setImage,
    setOptionText,
    setQuestion
  } from './multiple-choice-utils';

  let { block, onDataChange, onRequestImage }: BlockEditProps<'multiple_choice'> = $props();

  async function addImage() {
    const imageUrl = await onRequestImage();
    if (!imageUrl) return;

    onDataChange(setImage(block.data, imageUrl));
  }
</script>

<Block.MultipleChoice
  editable
  question={block.data.question}
  options={block.data.options}
  correctOptionId={block.data.correctOptionId}
  imageUrl={block.data.imageUrl}
  minOptions={MULTIPLE_CHOICE_MIN_OPTIONS}
  maxOptions={MULTIPLE_CHOICE_MAX_OPTIONS}
  questionMaxLength={MULTIPLE_CHOICE_QUESTION_MAX_LENGTH}
  optionMaxLength={MULTIPLE_CHOICE_OPTION_MAX_LENGTH}
  labels={getMultipleChoiceLabels()}
  testId="block-multiple-choice-edit"
  onQuestionInput={(question) => onDataChange(setQuestion(block.data, question))}
  onOptionInput={(optionId, text) => onDataChange(setOptionText(block.data, optionId, text))}
  onMarkCorrect={(optionId) => onDataChange(markCorrectOption(block.data, optionId))}
  onAddOption={() => onDataChange(addOption(block.data, getNewOptionText()))}
  onRemoveOption={(optionId) => onDataChange(removeOption(block.data, optionId))}
  onAddImage={addImage}
  onRemoveImage={() => onDataChange(setImage(block.data, null))}
/>
