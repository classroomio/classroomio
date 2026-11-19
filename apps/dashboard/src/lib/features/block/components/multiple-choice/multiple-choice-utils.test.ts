import { describe, expect, it } from 'vitest';
import { ZMultipleChoiceBlockData, type TMultipleChoiceBlockData } from '@cio/utils/validation/block';
import {
  addOption,
  createExampleMultipleChoice,
  markCorrectOption,
  removeOption,
  setImage,
  setOptionText
} from './multiple-choice-utils';

function threeOptions(): TMultipleChoiceBlockData {
  return {
    question: 'What is the capital city of Italy?',
    options: [
      { id: 'a', text: 'Rome' },
      { id: 'b', text: 'Athens' },
      { id: 'c', text: 'Lisbon' }
    ],
    correctOptionId: 'a'
  };
}

describe('multiple choice utils', () => {
  it('creates a valid example with the first option marked correct', () => {
    const example = createExampleMultipleChoice({
      question: 'What is the capital city of Italy?',
      correctOption: 'Rome',
      otherOptions: ['Athens', 'Lisbon']
    });

    expect(ZMultipleChoiceBlockData.safeParse(example).success).toBe(true);
    expect(example.options.map((option) => option.text)).toEqual(['Rome', 'Athens', 'Lisbon']);
    expect(example.correctOptionId).toBe(example.options[0].id);
  });

  it('keeps exactly one correct option when marking another', () => {
    const data = markCorrectOption(threeOptions(), 'c');

    expect(data.correctOptionId).toBe('c');
    expect(markCorrectOption(data, 'missing')).toBe(data);
  });

  it('makes the first remaining option correct when the correct one is removed', () => {
    const data = removeOption(threeOptions(), 'a');

    expect(data.options.map((option) => option.id)).toEqual(['b', 'c']);
    expect(data.correctOptionId).toBe('b');
    expect(ZMultipleChoiceBlockData.safeParse(data).success).toBe(true);
  });

  it('keeps the correct option when another one is removed', () => {
    const data = removeOption(threeOptions(), 'b');

    expect(data.correctOptionId).toBe('a');
  });

  it('never goes below two options', () => {
    const twoOptions = removeOption(threeOptions(), 'c');

    expect(removeOption(twoOptions, 'b')).toBe(twoOptions);
  });

  it('stops adding at ten options', () => {
    let data = threeOptions();
    for (let index = 0; index < 10; index += 1) {
      data = addOption(data, 'New option', `added-${index}`);
    }

    expect(data.options).toHaveLength(10);
    expect(ZMultipleChoiceBlockData.safeParse(data).success).toBe(true);
  });

  it('edits one option text and clears the image key when the image is removed', () => {
    const withImage = setImage(threeOptions(), 'https://example.com/rome.png');
    const edited = setOptionText(setImage(withImage, null), 'b', 'Madrid');

    expect(edited.options[1].text).toBe('Madrid');
    expect('imageUrl' in edited).toBe(false);
  });
});
