import type { QuestionTypeKey } from './question-type-keys';
import type { ExerciseQuestionModel } from './exercise-types';
import type {
  AnswerData,
  RadioAnswerData,
  CheckboxAnswerData,
  TrueFalseAnswerData,
  ThumbsAnswerData,
  TextareaAnswerData,
  ShortAnswerData,
  NumericAnswerData,
  FillBlankAnswerData,
  WordBankAnswerData,
  FileUploadAnswerData,
  MatchingAnswerData,
  OrderingAnswerData,
  LinkAnswerData,
  HotspotAnswerData,
  StarAnswerData,
  VideoRecordingAnswerData,
  MathExpressionAnswerData,
  WorkedSolutionAnswerData,
  WorkedSolutionFile
} from './answer-data';

import { QUESTION_TYPE_KEY } from './question-type-keys';
import { getStarRatingMaxFromSettings, isValidStarRatingValue } from './star-rating-settings';

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

const THUMBS_CODEC: AnswerCodec<ThumbsAnswerData> = {
  type: 'THUMBS',
  toApiPayload(data, questionId) {
    return { questionId, answer: String(data.value) };
  },
  fromApiPayload(payload) {
    if (payload.answer === undefined) return null;
    const resolved = labelToBoolean(payload.answer);
    if (resolved === undefined) return null;
    return { type: 'THUMBS', value: resolved };
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
    return { questionId, answer: JSON.stringify({ type: 'NUMERIC', value: data.value, latex: data.latex }) };
  },
  fromApiPayload(payload) {
    if (!payload.answer) return null;
    const { value, latex } = JSON.parse(payload.answer) as { type: 'NUMERIC'; value: number; latex?: unknown };
    const typedLatex = typeof latex === 'string' ? latex.trim() : '';
    return typedLatex ? { type: 'NUMERIC', value, latex: typedLatex } : { type: 'NUMERIC', value };
  }
};

function parseJsonObject(answer: string | undefined): Record<string, unknown> | null {
  if (!answer) return null;

  try {
    const parsed: unknown = JSON.parse(answer);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function readLatex(parsed: Record<string, unknown>): string {
  return typeof parsed.latex === 'string' ? parsed.latex.trim() : '';
}

const MATH_EXPRESSION_CODEC: AnswerCodec<MathExpressionAnswerData> = {
  type: 'MATH_EXPRESSION',
  toApiPayload(data, questionId) {
    return { questionId, answer: JSON.stringify(data) };
  },
  fromApiPayload(payload) {
    const parsed = parseJsonObject(payload.answer);
    const latex = parsed?.type === 'MATH_EXPRESSION' ? readLatex(parsed) : '';
    if (!latex) return null;

    return { type: 'MATH_EXPRESSION', latex };
  }
};

function readWorkedSolutionFiles(raw: unknown): WorkedSolutionFile[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((file): file is Record<string, unknown> => Boolean(file) && typeof file === 'object')
    .filter((file) => (file.kind === 'drawing' || file.kind === 'photo') && typeof file.fileKey === 'string')
    .map((file) => ({
      kind: file.kind as WorkedSolutionFile['kind'],
      fileKey: String(file.fileKey),
      fileName: String(file.fileName ?? '')
    }));
}

const WORKED_SOLUTION_CODEC: AnswerCodec<WorkedSolutionAnswerData> = {
  type: 'WORKED_SOLUTION',
  toApiPayload(data, questionId) {
    const files = data.working.files.map(({ fileUrl: _fileUrl, ...file }) => file);
    return { questionId, answer: JSON.stringify({ ...data, working: { ...data.working, files } }) };
  },
  fromApiPayload(payload) {
    const parsed = parseJsonObject(payload.answer);
    if (parsed?.type !== 'WORKED_SOLUTION') return null;

    const working =
      parsed.working && typeof parsed.working === 'object' ? (parsed.working as Record<string, unknown>) : {};
    const lines = Array.isArray(working.lines) ? working.lines.map((line) => String(line ?? '')).filter(Boolean) : [];
    const files = readWorkedSolutionFiles(working.files);
    const latex = readLatex(parsed);
    if (!latex && lines.length === 0 && files.length === 0) return null;

    return { type: 'WORKED_SOLUTION', latex, working: { lines, files } };
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
    const values = answers.map((value) => String(value ?? '').trim());
    return values.some(Boolean) ? { type: 'FILL_BLANK', values } : null;
  }
};

/**
 * Reads fill-blank `settings.acceptedAnswers` as blanks × alternatives, keeping empty entries for editing.
 * The legacy comma-separated string becomes one blank per comma-separated value.
 */
export function decodeFillBlankAcceptedAnswers(raw: unknown): string[][] {
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => [value]);
  }

  if (!Array.isArray(raw)) return [];

  return raw.map((blank) => (Array.isArray(blank) ? blank.map((value) => String(value ?? '')) : [String(blank ?? '')]));
}

/** Fill-blank answer key: trimmed alternatives per blank, without empty alternatives or blanks that have none. */
export function getFillBlankAnswerKey(raw: unknown): string[][] {
  return decodeFillBlankAcceptedAnswers(raw)
    .map((alternatives) => alternatives.map((value) => value.trim()).filter(Boolean))
    .filter((alternatives) => alternatives.length > 0);
}

const WORD_BANK_CODEC: AnswerCodec<WordBankAnswerData> = {
  type: 'WORD_BANK',
  toApiPayload(data, questionId) {
    return { questionId, answer: JSON.stringify({ type: 'WORD_BANK', filledBlanks: data.filledBlanks }) };
  },
  fromApiPayload(payload) {
    if (!payload.answer) return null;
    try {
      const parsed = JSON.parse(payload.answer) as { type?: string; filledBlanks?: string[] };
      if (parsed?.type !== 'WORD_BANK' || !Array.isArray(parsed.filledBlanks)) return null;
      return { type: 'WORD_BANK', filledBlanks: parsed.filledBlanks.map((v) => String(v ?? '')) };
    } catch {
      return null;
    }
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

const STAR_CODEC: AnswerCodec<StarAnswerData> = {
  type: 'STAR',
  toApiPayload(data, questionId) {
    return { questionId, answer: JSON.stringify({ type: 'STAR', value: data.value }) };
  },
  fromApiPayload(payload, question) {
    if (!payload.answer) return null;
    try {
      const parsed = JSON.parse(payload.answer) as { type?: string; value?: unknown };
      if (parsed?.type !== 'STAR') return null;
      const maxStars = getStarRatingMaxFromSettings(question.settings);
      if (!isValidStarRatingValue(parsed.value, maxStars)) return null;
      return { type: 'STAR', value: parsed.value };
    } catch {
      return null;
    }
  }
};

function isVideoRecordingAnswer(value: unknown): value is Omit<VideoRecordingAnswerData, 'type'> & { type?: string } {
  if (!value || typeof value !== 'object') return false;

  const data = value as Partial<VideoRecordingAnswerData>;
  return (
    typeof data.assetId === 'string' &&
    data.assetId.length > 0 &&
    typeof data.storageKey === 'string' &&
    data.storageKey.length > 0 &&
    typeof data.fileName === 'string' &&
    typeof data.mimeType === 'string' &&
    data.mimeType.startsWith('video/') &&
    typeof data.size === 'number' &&
    Number.isFinite(data.size) &&
    data.size > 0 &&
    typeof data.durationSeconds === 'number' &&
    Number.isFinite(data.durationSeconds) &&
    data.durationSeconds > 0 &&
    typeof data.recordedAt === 'string' &&
    typeof data.uploadedAt === 'string' &&
    data.provider === 'cloudflare'
  );
}

const VIDEO_RECORDING_CODEC: AnswerCodec<VideoRecordingAnswerData> = {
  type: 'VIDEO_RECORDING',
  toApiPayload(data, questionId) {
    const { playbackUrl: _playbackUrl, ...answerData } = data;
    return { questionId, answer: JSON.stringify(answerData) };
  },
  fromApiPayload(payload) {
    if (!payload.answer) return null;

    try {
      const parsed = JSON.parse(payload.answer) as Partial<VideoRecordingAnswerData>;
      if (parsed?.type !== 'VIDEO_RECORDING' || !isVideoRecordingAnswer(parsed)) return null;

      return {
        type: 'VIDEO_RECORDING',
        assetId: parsed.assetId,
        storageKey: parsed.storageKey,
        fileName: parsed.fileName,
        mimeType: parsed.mimeType,
        size: parsed.size,
        durationSeconds: parsed.durationSeconds,
        recordedAt: parsed.recordedAt,
        uploadedAt: parsed.uploadedAt,
        provider: 'cloudflare',
        retakeCount: typeof parsed.retakeCount === 'number' ? parsed.retakeCount : undefined
      };
    } catch {
      return null;
    }
  }
};

export const ANSWER_CODECS: Record<QuestionTypeKey, AnswerCodec> = {
  [QUESTION_TYPE_KEY.RADIO]: RADIO_CODEC,
  [QUESTION_TYPE_KEY.CHECKBOX]: CHECKBOX_CODEC,
  [QUESTION_TYPE_KEY.TRUE_FALSE]: TRUE_FALSE_CODEC,
  [QUESTION_TYPE_KEY.THUMBS]: THUMBS_CODEC,
  [QUESTION_TYPE_KEY.TEXTAREA]: TEXTAREA_CODEC,
  [QUESTION_TYPE_KEY.SHORT_ANSWER]: SHORT_ANSWER_CODEC,
  [QUESTION_TYPE_KEY.NUMERIC]: NUMERIC_CODEC,
  [QUESTION_TYPE_KEY.FILL_BLANK]: FILL_BLANK_CODEC,
  [QUESTION_TYPE_KEY.WORD_BANK]: WORD_BANK_CODEC,
  [QUESTION_TYPE_KEY.FILE_UPLOAD]: FILE_UPLOAD_CODEC,
  [QUESTION_TYPE_KEY.MATCHING]: MATCHING_CODEC,
  [QUESTION_TYPE_KEY.ORDERING]: ORDERING_CODEC,
  [QUESTION_TYPE_KEY.LINK]: LINK_CODEC,
  [QUESTION_TYPE_KEY.HOTSPOT]: HOTSPOT_CODEC,
  [QUESTION_TYPE_KEY.STAR]: STAR_CODEC,
  [QUESTION_TYPE_KEY.VIDEO_RECORDING]: VIDEO_RECORDING_CODEC,
  [QUESTION_TYPE_KEY.MATH_EXPRESSION]: MATH_EXPRESSION_CODEC,
  [QUESTION_TYPE_KEY.WORKED_SOLUTION]: WORKED_SOLUTION_CODEC
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
    case 'THUMBS':
      return {
        selectedIds: [String(data.value)],
        selectedValues: [data.value]
      };
    case 'TEXTAREA':
    case 'SHORT_ANSWER':
      return { selectedIds: [], selectedValues: [], text: data.text };
    case 'NUMERIC':
      return { selectedIds: [], selectedValues: [], text: data.latex ?? String(data.value) };
    case 'MATH_EXPRESSION':
    case 'WORKED_SOLUTION':
      return { selectedIds: [], selectedValues: [], text: data.latex };
    case 'STAR':
      return { selectedIds: [], selectedValues: [data.value], text: String(data.value) };
    case 'FILL_BLANK':
      return { selectedIds: [], selectedValues: [], text: data.values.filter(Boolean).join(', ') };
    case 'WORD_BANK':
      return { selectedIds: [], selectedValues: [], text: data.filledBlanks.filter(Boolean).join(', ') };
    case 'LINK':
      return { selectedIds: [], selectedValues: data.urls, text: data.urls.join(', ') };
    case 'MATCHING':
    case 'ORDERING':
    case 'HOTSPOT':
    case 'FILE_UPLOAD':
    case 'VIDEO_RECORDING':
      return { selectedIds: [], selectedValues: [] };
    default:
      return { selectedIds: [], selectedValues: [] };
  }
}
