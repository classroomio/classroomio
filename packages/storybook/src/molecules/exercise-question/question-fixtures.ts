export interface QuestionStoryFixture {
  question: Record<string, unknown>;
  /** Correct answer (`AnswerData` or legacy shapes supported by renderers). */
  answer?: unknown;
  /** Incorrect answer for Review Mode demos in Storybook (`AnswerData`). */
  wrongAnswer?: unknown;
}

export interface ExerciseSectionStoryFixture {
  id: string;
  title: string;
  description?: string;
  order: number;
  colorTheme: 'blue' | 'green' | 'amber' | 'rose' | 'violet' | 'slate';
  questions: Record<string, unknown>[];
}

const OPTION_IMAGE_A = 'https://brand.cdn.clsrio.com/classroomio-lms-courses.png';
const OPTION_IMAGE_B = 'https://assets.cdn.clsrio.com/www/futuristic-classroom.jpg';

export const RADIO_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-radio',
    key: 'q-radio',
    title: 'Which runtime powers most ClassroomIO backend APIs? [RADIO]',
    questionType: 'RADIO',
    settings: {
      description: 'Choose one option.',
      imageUrls: ['https://brand.cdn.clsrio.com/classroomio-courses.png']
    },
    options: [
      {
        id: 1001,
        label: 'Node.js',
        value: 'nodejs',
        isCorrect: true,
        settings: { imageUrl: OPTION_IMAGE_A }
      },
      {
        id: 1002,
        label: 'PHP',
        value: 'php',
        settings: { imageUrl: OPTION_IMAGE_B }
      },
      { id: 1003, label: 'Ruby', value: 'ruby' }
    ]
  },
  answer: { type: 'RADIO', optionId: 1001 },
  wrongAnswer: { type: 'RADIO', optionId: 1002 }
};

export const CHECKBOX_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-checkbox',
    key: 'q-checkbox',
    title: 'Select benefits of TypeScript for an LMS product. [CHECKBOX]',
    questionType: 'CHECKBOX',
    settings: {
      description: 'Select one or more options.'
    },
    options: [
      {
        id: 2001,
        label: 'Better editor autocompletion',
        value: 'autocomplete',
        isCorrect: true,
        settings: { imageUrl: OPTION_IMAGE_A }
      },
      { id: 2002, label: 'No build tools needed', value: 'no-build-tools' },
      {
        id: 2003,
        label: 'Safer refactoring',
        value: 'safer-refactor',
        isCorrect: true,
        settings: { imageUrl: OPTION_IMAGE_B }
      }
    ]
  },
  answer: { type: 'CHECKBOX', optionIds: [2001, 2003] },
  wrongAnswer: { type: 'CHECKBOX', optionIds: [2002] }
};

export const TEXTAREA_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-textarea',
    key: 'q-textarea',
    title: 'Explain why exercise feedback should be specific. [TEXTAREA]',
    questionType: 'TEXTAREA',
    settings: {
      description: 'Provide a detailed response.',
      minCharacters: 30,
      maxCharacters: 250
    }
  },
  answer: '<p>Specific feedback helps students improve on the next attempt quickly.</p>'
};

export const THUMBS_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-thumbs',
    key: 'q-thumbs',
    title: 'Thumbs Up or Down: Would you recommend ClassroomIO to a colleague? [THUMBS]',
    questionType: 'THUMBS',
    options: [
      { id: 5001, label: 'Yes', value: 'true' },
      { id: 5002, label: 'No', value: 'false', isCorrect: false }
    ],
    settings: {
      correctValue: true
    }
  },
  answer: { type: 'THUMBS', value: true },
  wrongAnswer: { type: 'THUMBS', value: false }
};

export const TRUE_FALSE_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-true-false',
    key: 'q-true-false',
    title: 'True or False: Multiple-choice questions can be auto-graded. [TRUE_FALSE]',
    questionType: 'TRUE_FALSE',
    options: [
      { id: 4001, label: 'True', value: 'true' },
      { id: 4002, label: 'False', value: 'false', isCorrect: false }
    ],
    settings: {
      correctValue: true
    }
  },
  answer: { type: 'TRUE_FALSE', value: true },
  wrongAnswer: { type: 'TRUE_FALSE', value: false }
};

export const SHORT_ANSWER_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-short-answer',
    key: 'q-short-answer',
    title: 'Name one strategy for reducing flaky frontend tests. [SHORT_ANSWER]',
    questionType: 'SHORT_ANSWER',
    settings: {
      instructions: 'Answer in one sentence.',
      acceptedAnswers: 'use deterministic test fixtures'
    }
  },
  answer: { type: 'SHORT_ANSWER', text: 'Use deterministic test fixtures' },
  wrongAnswer: { type: 'SHORT_ANSWER', text: 'Guess randomly every time' }
};

export const NUMERIC_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-numeric',
    key: 'q-numeric',
    title: 'How many minutes are in a 1.5 hour workshop? [NUMERIC]',
    questionType: 'NUMERIC',
    settings: { correctValue: 90, tolerance: 0 }
  },
  answer: { type: 'NUMERIC', value: 90 },
  wrongAnswer: { type: 'NUMERIC', value: 42 }
};

export const STAR_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-star',
    key: 'q-star',
    title: 'How clear were the lesson objectives? [STAR]',
    questionType: 'STAR',
    settings: { correctValue: 4, maxStars: 5 }
  },
  answer: { type: 'STAR', value: 4 },
  wrongAnswer: { type: 'STAR', value: 2 }
};

export const FILL_BLANK_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-fill-blank',
    key: 'q-fill-blank',
    title: 'An ___ endpoint should be idempotent when using PUT. [FILL_BLANK]',
    questionType: 'FILL_BLANK',
    settings: { acceptedAnswers: 'API,endpoint' }
  },
  answer: { type: 'FILL_BLANK', values: ['API'] },
  wrongAnswer: { type: 'FILL_BLANK', values: ['SOAP'] }
};

export const WORD_BANK_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-word-bank',
    key: 'q-word-bank',
    title: 'Match each term with the sentence. [WORD_BANK]',
    questionType: 'WORD_BANK',
    settings: {
      template:
        'Measurements to describe our data are called ___. The ___ shows values and how often they occur. Outliers appear when data is skewed or has ___.',
      correctAnswers: ['summary statistics', 'distribution', 'outliers'],
      distractors: ['categorical variables', 'linear relationships', 'numeric variables']
    }
  },
  answer: {
    type: 'WORD_BANK',
    filledBlanks: ['summary statistics', 'distribution', 'outliers']
  },
  wrongAnswer: {
    type: 'WORD_BANK',
    filledBlanks: ['numeric variables', 'distribution', 'linear relationships']
  }
};

export const FILE_UPLOAD_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-file-upload',
    key: 'q-file-upload',
    title: 'Upload your lesson plan document. [FILE_UPLOAD]',
    questionType: 'FILE_UPLOAD',
    settings: {
      acceptedTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ],
      maxSizeMb: 2
    }
  },
  answer: 'lesson-plan-week-03.pdf'
};

export const VIDEO_RECORDING_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-video-recording',
    key: 'q-video-recording',
    title: 'Record a short reflection on what you learned. [VIDEO_RECORDING]',
    questionType: 'VIDEO_RECORDING',
    settings: {
      description: 'Use the browser camera and microphone. You can retake before submitting.',
      maxDurationSeconds: 120,
      allowRetakes: true
    }
  },
  answer: {
    type: 'VIDEO_RECORDING',
    assetId: '00000000-0000-4000-8000-000000000001',
    storageKey: 'exercise-recordings/story/video-recording-demo.webm',
    fileName: 'video-recording-demo.webm',
    mimeType: 'video/webm',
    size: 1_204_224,
    durationSeconds: 42,
    recordedAt: '2026-04-30T12:00:00.000Z',
    uploadedAt: '2026-04-30T12:01:00.000Z',
    provider: 'cloudflare',
    retakeCount: 2,
    playbackUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm'
  }
};

export const MATCHING_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-matching',
    key: 'q-matching',
    title: 'Match each layer to the ClassroomIO responsibility. [MATCHING]',
    questionType: 'MATCHING',
    settings: {
      pairs: [
        { left: 'API', right: 'request validation' },
        { left: 'DB', right: 'persistent storage' }
      ]
    }
  },
  answer: { API: 'request validation', DB: 'persistent storage' }
};

export const ORDERING_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-ordering',
    key: 'q-ordering',
    title: 'Order these release steps for a new exercise type. [ORDERING]',
    questionType: 'ORDERING',
    options: [
      { id: 'order-1', label: 'Design schema', value: 'Design schema' },
      { id: 'order-2', label: 'Implement renderer', value: 'Implement renderer' },
      { id: 'order-3', label: 'Ship to production', value: 'Ship to production' }
    ],
    settings: {
      items: ['Design schema', 'Implement renderer', 'Ship to production']
    }
  },
  answer: { type: 'ORDERING', orderedValues: ['order-1', 'order-2', 'order-3'] },
  wrongAnswer: { type: 'ORDERING', orderedValues: ['order-3', 'order-1', 'order-2'] }
};

export const HOTSPOT_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-hotspot',
    key: 'q-hotspot',
    title: 'Mark where the submit button should appear in the layout. [HOTSPOT]',
    questionType: 'HOTSPOT',
    settings: {
      hotspots: [{ x: 46, y: 68 }]
    }
  },
  answer: { points: [{ x: 46, y: 68 }] }
};

export const LINK_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-link',
    key: 'q-link',
    title: 'Share the resources you used while solving this exercise. [LINK]',
    questionType: 'LINK',
    settings: {
      instructions: 'Add one or more relevant links.'
    }
  },
  answer: ['https://classroomio.com/docs', 'https://www.svelte.dev']
};

export const SECTIONED_EXERCISE_FIXTURE: ExerciseSectionStoryFixture[] = [
  {
    id: 'section-foundations',
    title: 'Foundations',
    description: 'A short warm-up section before the applied scenario.',
    order: 0,
    colorTheme: 'blue',
    questions: [RADIO_FIXTURE.question, TRUE_FALSE_FIXTURE.question]
  },
  {
    id: 'section-application',
    title: 'Applied Practice',
    description: 'Students solve open-response and ordering tasks.',
    order: 1,
    colorTheme: 'green',
    questions: [SHORT_ANSWER_FIXTURE.question, ORDERING_FIXTURE.question]
  }
];
