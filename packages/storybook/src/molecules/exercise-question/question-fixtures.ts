export interface QuestionStoryFixture {
  question: Record<string, unknown>;
  answer?: unknown;
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
  answer: 1001
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
  answer: ['2001', '2003']
};

export const TEXTAREA_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-textarea',
    key: 'q-textarea',
    title: 'Explain why exercise feedback should be specific. [TEXTAREA]',
    questionType: 'TEXTAREA',
    settings: {
      description: 'Provide a detailed response.'
    }
  },
  answer: '<p>Specific feedback helps students improve on the next attempt quickly.</p>'
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
  answer: true
};

export const SHORT_ANSWER_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-short-answer',
    key: 'q-short-answer',
    title: 'Name one strategy for reducing flaky frontend tests. [SHORT_ANSWER]',
    questionType: 'SHORT_ANSWER',
    settings: {
      instructions: 'Answer in one sentence.'
    }
  },
  answer: 'Use deterministic test fixtures'
};

export const NUMERIC_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-numeric',
    key: 'q-numeric',
    title: 'How many minutes are in a 1.5 hour workshop? [NUMERIC]',
    questionType: 'NUMERIC',
    settings: { correctValue: 90, tolerance: 0 }
  },
  answer: 90
};

export const FILL_BLANK_FIXTURE: QuestionStoryFixture = {
  question: {
    id: 'q-fill-blank',
    key: 'q-fill-blank',
    title: 'An ___ endpoint should be idempotent when using PUT. [FILL_BLANK]',
    questionType: 'FILL_BLANK',
    settings: { acceptedAnswers: 'API,endpoint' }
  },
  answer: ['API']
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
  answer: ['order-1', 'order-2', 'order-3']
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
