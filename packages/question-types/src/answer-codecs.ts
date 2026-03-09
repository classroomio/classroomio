import type { QuestionTypeKey } from './question-type-keys';
import type { ExerciseQuestionModel } from './exercise-types';
import type {
  AnswerData,
  RadioAnswerData,
  CheckboxAnswerData,
  TrueFalseAnswerData,
  TextareaAnswerData,
  ShortAnswerData,
  NumericAnswerData,
  FillBlankAnswerData,
  FileUploadAnswerData,
  MatchingAnswerData,
  OrderingAnswerData,
  LinkAnswerData,
  HotspotAnswerData
} from './answer-data';

import { QUESTION_TYPE_KEY } from './question-type-keys';

export type ApiPayload = { questionId: number; optionId?: number; answer?: string };

export interface AnswerCodec<T extends AnswerData = AnswerData> {
  type: T['type'];
  /** Structured AnswerData -> flat API payload for submission */
  toApiPayload(data: T, questionId: number): ApiPayload;
  /** Flat API payload -> AnswerData (for API write path) */
  fromApiPayload(
    payload: { questionId: number; optionId?: number; answer?: string },
    question: ExerciseQuestionModel
  ): T | null;
}

const TRUE_LABELS = new Set(['true', '1', 'yes']);
const FALSE_LABELS = new Set(['false', '0', 'no']);

function labelToBoolean(label: string): boolean | undefined {
  const normalized = label.trim().toLowerCase();
  if (TRUE_LABELS.has(normalized)) return true;
  if (FALSE_LABELS.has(normalized)) return false;
  return undefined;
}

const RADIO_CODEC: AnswerCodec<RadioAnswerData> = {
  type: 'RADIO',
  toApiPayload(data, questionId) {
    return { questionId, optionId: data.optionId };
  },
  fromApiPayload(payload) {
    const optionId = payload.optionId;
    if (optionId === undefined || Number.isNaN(optionId)) return null;
    return { type: 'RADIO', optionId };
  }
};

const CHECKBOX_CODEC: AnswerCodec<CheckboxAnswerData> = {
  type: 'CHECKBOX',
  toApiPayload(data, questionId) {
    return {
      questionId,
      answer: JSON.stringify({ type: 'CHECKBOX', optionIds: data.optionIds })
    };
  },
  fromApiPayload(payload) {
    if (!payload.answer) return null;
    const { optionIds } = JSON.parse(payload.answer) as { type: 'CHECKBOX'; optionIds: number[] };
    if (!Array.isArray(optionIds)) return null;
    return { type: 'CHECKBOX', optionIds };
  }
};

const TRUE_FALSE_CODEC: AnswerCodec<TrueFalseAnswerData> = {
  type: 'TRUE_FALSE',
  toApiPayload(data, questionId) {
    return { questionId, answer: String(data.value) };
  },
  fromApiPayload(payload) {
    if (payload.answer === undefined) return null;
    const resolved = labelToBoolean(payload.answer);
    if (resolved === undefined) return null;
    return { type: 'TRUE_FALSE', value: resolved };
  }
};

const TEXTAREA_CODEC: AnswerCodec<TextareaAnswerData> = {
  type: 'TEXTAREA',
  toApiPayload(data, questionId) {
    return { questionId, answer: data.text };
  },
  fromApiPayload(payload) {
    if (payload.answer === undefined) return null;
    return { type: 'TEXTAREA', text: payload.answer };
  }
};

const SHORT_ANSWER_CODEC: AnswerCodec<ShortAnswerData> = {
  type: 'SHORT_ANSWER',
  toApiPayload(data, questionId) {
    return { questionId, answer: data.text };
  },
  fromApiPayload(payload) {
    if (payload.answer === undefined) return null;
    return { type: 'SHORT_ANSWER', text: payload.answer };
  }
};

const NUMERIC_CODEC: AnswerCodec<NumericAnswerData> = {
  type: 'NUMERIC',
  toApiPayload(data, questionId) {
    return { questionId, answer: JSON.stringify({ type: 'NUMERIC', value: data.value }) };
  },
  fromApiPayload(payload) {
    if (!payload.answer) return null;
    const { value } = JSON.parse(payload.answer) as { type: 'NUMERIC'; value: number };
    return { type: 'NUMERIC', value };
  }
};

const FILL_BLANK_CODEC: AnswerCodec<FillBlankAnswerData> = {
  type: 'FILL_BLANK',
  toApiPayload(data, questionId) {
    return { questionId, answer: JSON.stringify({ type: 'FILL_BLANK', answers: data.values }) };
  },
  fromApiPayload(payload) {
    if (!payload.answer) return null;
    const { answers } = JSON.parse(payload.answer) as { type: 'FILL_BLANK'; answers: string[] };
    const values = answers.map((v) => String(v).trim()).filter(Boolean);
    return values.length > 0 ? { type: 'FILL_BLANK', values } : null;
  }
};

const FILE_UPLOAD_CODEC: AnswerCodec<FileUploadAnswerData> = {
  type: 'FILE_UPLOAD',
  toApiPayload(data, questionId) {
    const obj = { fileKey: data.fileKey, fileName: data.fileName, mimeType: data.mimeType, size: data.size };
    return { questionId, answer: JSON.stringify(obj) };
  },
  fromApiPayload(payload) {
    if (!payload.answer) return null;
    const p = JSON.parse(payload.answer) as {
      fileKey: string;
      fileName?: string;
      mimeType?: string;
      size?: number;
    };
    return {
      type: 'FILE_UPLOAD',
      fileKey: p.fileKey,
      fileName: p.fileName ?? '',
      mimeType: p.mimeType,
      size: p.size
    };
  }
};

const MATCHING_CODEC: AnswerCodec<MatchingAnswerData> = {
  type: 'MATCHING',
  toApiPayload(data, questionId) {
    return { questionId, answer: JSON.stringify({ type: 'MATCHING', value: data.pairs }) };
  },
  fromApiPayload(payload) {
    if (!payload.answer) return null;
    const { value: pairs } = JSON.parse(payload.answer) as {
      type: 'MATCHING';
      value: Array<{ left: string; right: string }>;
    };
    return pairs.length > 0 ? { type: 'MATCHING', pairs } : null;
  }
};

const ORDERING_CODEC: AnswerCodec<OrderingAnswerData> = {
  type: 'ORDERING',
  toApiPayload(data, questionId) {
    return { questionId, answer: JSON.stringify({ type: 'ORDERING', value: data.orderedValues }) };
  },
  fromApiPayload(payload) {
    if (!payload.answer) return null;
    const { value: orderedValues } = JSON.parse(payload.answer) as { type: 'ORDERING'; value: string[] };
    return orderedValues.length > 0 ? { type: 'ORDERING', orderedValues } : null;
  }
};

const LINK_CODEC: AnswerCodec<LinkAnswerData> = {
  type: 'LINK',
  toApiPayload(data, questionId) {
    return { questionId, answer: JSON.stringify({ type: 'LINK', links: data.urls }) };
  },
  fromApiPayload(payload) {
    if (!payload.answer) return null;
    const { links } = JSON.parse(payload.answer) as { type: 'LINK'; links: string[] };
    const urls = links.map((v) => String(v).trim()).filter(Boolean);
    return urls.length > 0 ? { type: 'LINK', urls } : null;
  }
};

const HOTSPOT_CODEC: AnswerCodec<HotspotAnswerData> = {
  type: 'HOTSPOT',
  toApiPayload(data, questionId) {
    return { questionId, answer: JSON.stringify({ type: 'HOTSPOT', value: data.coordinates }) };
  },
  fromApiPayload(payload) {
    if (!payload.answer) return null;
    const { value: coordinates } = JSON.parse(payload.answer) as {
      type: 'HOTSPOT';
      value: Array<{ x: number; y: number }>;
    };
    return coordinates.length > 0 ? { type: 'HOTSPOT', coordinates } : null;
  }
};

export const ANSWER_CODECS: Record<QuestionTypeKey, AnswerCodec> = {
  [QUESTION_TYPE_KEY.RADIO]: RADIO_CODEC,
  [QUESTION_TYPE_KEY.CHECKBOX]: CHECKBOX_CODEC,
  [QUESTION_TYPE_KEY.TRUE_FALSE]: TRUE_FALSE_CODEC,
  [QUESTION_TYPE_KEY.TEXTAREA]: TEXTAREA_CODEC,
  [QUESTION_TYPE_KEY.SHORT_ANSWER]: SHORT_ANSWER_CODEC,
  [QUESTION_TYPE_KEY.NUMERIC]: NUMERIC_CODEC,
  [QUESTION_TYPE_KEY.FILL_BLANK]: FILL_BLANK_CODEC,
  [QUESTION_TYPE_KEY.FILE_UPLOAD]: FILE_UPLOAD_CODEC,
  [QUESTION_TYPE_KEY.MATCHING]: MATCHING_CODEC,
  [QUESTION_TYPE_KEY.ORDERING]: ORDERING_CODEC,
  [QUESTION_TYPE_KEY.LINK]: LINK_CODEC,
  [QUESTION_TYPE_KEY.HOTSPOT]: HOTSPOT_CODEC
};

/** Convert any answer to API submission payload */
export function toApiPayload(data: AnswerData, questionId: number): ApiPayload {
  return ANSWER_CODECS[data.type].toApiPayload(data as any, questionId);
}

/** Convert API payload to AnswerData (for API write path) */
export function fromApiPayload(
  questionTypeKey: QuestionTypeKey,
  payload: ApiPayload,
  question: ExerciseQuestionModel
): AnswerData | null {
  return ANSWER_CODECS[questionTypeKey].fromApiPayload(payload, question) as AnswerData | null;
}

/**
 * Extract display values from AnswerData for charts/summary display.
 * Returns selectedIds/selectedValues for option-based types, text for text types.
 */
export function extractAnswerDisplayValues(data: AnswerData): {
  selectedIds: string[];
  selectedValues: unknown[];
  text?: string;
} {
  switch (data.type) {
    case 'RADIO':
      return {
        selectedIds: [String(data.optionId)],
        selectedValues: [data.optionId]
      };
    case 'CHECKBOX':
      return {
        selectedIds: data.optionIds.map(String),
        selectedValues: data.optionIds
      };
    case 'TRUE_FALSE':
      return {
        selectedIds: [String(data.value)],
        selectedValues: [data.value]
      };
    case 'TEXTAREA':
    case 'SHORT_ANSWER':
      return { selectedIds: [], selectedValues: [], text: data.text };
    case 'NUMERIC':
      return { selectedIds: [], selectedValues: [], text: String(data.value) };
    case 'FILL_BLANK':
      return { selectedIds: [], selectedValues: [], text: data.values.join(', ') };
    case 'LINK':
      return { selectedIds: [], selectedValues: data.urls, text: data.urls.join(', ') };
    case 'MATCHING':
    case 'ORDERING':
    case 'HOTSPOT':
    case 'FILE_UPLOAD':
      return { selectedIds: [], selectedValues: [] };
    default:
      return { selectedIds: [], selectedValues: [] };
  }
}
