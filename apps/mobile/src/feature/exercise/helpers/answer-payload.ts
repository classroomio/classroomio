import type { AnswerData, SubmissionAnswerInput } from '@/feature/exercise/types/exercise';

/** Serializes an answer into the submission row the API decodes; matches `toApiPayload` in `@cio/question-types`. */
export function toSubmissionAnswer(answer: AnswerData, questionId: number): SubmissionAnswerInput {
  switch (answer.type) {
    case 'RADIO':
      return { questionId, optionId: answer.optionId };
    case 'CHECKBOX':
      return { questionId, answer: JSON.stringify({ type: 'CHECKBOX', optionIds: answer.optionIds }) };
    case 'TRUE_FALSE':
    case 'THUMBS':
      return { questionId, answer: String(answer.value) };
    case 'TEXTAREA':
    case 'SHORT_ANSWER':
      return { questionId, answer: answer.text };
    case 'NUMERIC':
      return { questionId, answer: JSON.stringify({ type: 'NUMERIC', value: answer.value }) };
    case 'FILL_BLANK':
      return { questionId, answer: JSON.stringify({ type: 'FILL_BLANK', answers: answer.values }) };
    case 'WORD_BANK':
      return { questionId, answer: JSON.stringify({ type: 'WORD_BANK', filledBlanks: answer.filledBlanks }) };
    case 'FILE_UPLOAD':
      return {
        questionId,
        answer: JSON.stringify({
          fileKey: answer.fileKey,
          fileName: answer.fileName,
          mimeType: answer.mimeType,
          size: answer.size
        })
      };
    case 'MATCHING':
      return { questionId, answer: JSON.stringify({ type: 'MATCHING', value: answer.pairs }) };
    case 'ORDERING':
      return { questionId, answer: JSON.stringify({ type: 'ORDERING', value: answer.orderedValues }) };
    case 'LINK':
      return { questionId, answer: JSON.stringify({ type: 'LINK', links: answer.urls }) };
    case 'HOTSPOT':
      return { questionId, answer: JSON.stringify({ type: 'HOTSPOT', value: answer.coordinates }) };
    case 'STAR':
      return { questionId, answer: JSON.stringify({ type: 'STAR', value: answer.value }) };
    case 'VIDEO_RECORDING': {
      const { playbackUrl: _playbackUrl, ...stored } = answer;

      return { questionId, answer: JSON.stringify(stored) };
    }
  }
}
