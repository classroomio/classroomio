import { QUESTION_TYPE_KEY, type QuestionTypeKey } from '@cio/question-types';

/** Hidden in the exercise editor; omitted from the marketing picker. */
const HIDDEN_QUESTION_TYPE_KEYS = new Set<QuestionTypeKey>([QUESTION_TYPE_KEY.MATCHING, QUESTION_TYPE_KEY.HOTSPOT]);

export type QuestionTypePickerEntry = {
  key: QuestionTypeKey;
  /** Sidebar label */
  displayLabel: string;
  /** One-line benefit shown above the preview */
  description: string;
  /** Letter or symbol shown inside the sidebar icon tile (design); omit to use a Lucide icon. */
  sidebarGlyph?: string;
  /** Passed to QuestionRenderer as `question` */
  demoQuestion: Record<string, unknown>;
};

/**
 * Option images: Unsplash (free to use under the Unsplash License).
 * https://unsplash.com/license
 */
const UNSPLASH = {
  /** Small group collaborative learning */
  teamWorkshop: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=640&q=80',
  /** Focused individual on laptop */
  selfPacedOnline: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=640&q=80',
  /** Books / reading */
  readingStudy: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82fc?auto=format&fit=crop&w=640&q=80',
  /** Documents / paperwork — PDFs and policy packs */
  documentStack: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=640&q=80',
  /** Large meeting / town hall */
  townHall: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=640&q=80',
  /** Desk with notes — formative practice */
  notesPractice: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=640&q=80',
  /** Lecture hall — evokes long recorded sessions */
  lectureRecording: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=640&q=80',
  /** Diverse team discussion */
  peerDiscussion: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=640&q=80',
  /** Deep work / concentration */
  focusedWork: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=640&q=80'
} as const;

/** Order matches the product marketing layout (see question type picker design). */
const QUESTION_TYPE_PICKER_ENTRIES: QuestionTypePickerEntry[] = [
  {
    key: QUESTION_TYPE_KEY.RADIO,
    displayLabel: 'Single answer',
    description: 'Several options, one correct choice — the classic multiple-choice format.',
    demoQuestion: {
      id: 'picker-radio',
      key: 'picker-radio',
      title:
        'Your company is redesigning onboarding. Which approach typically improves completion rates for mandatory compliance training?',
      questionType: 'RADIO',
      settings: {
        description: 'Choose the option that best matches evidence-based practice for busy professionals.'
      },
      options: [
        {
          id: 1001,
          label: 'Short modules (about 5–10 minutes) learners can finish between meetings',
          value: 'microlearning',
          isCorrect: true,
          settings: { imageUrl: UNSPLASH.selfPacedOnline }
        },
        {
          id: 1002,
          label: 'A single long video recording of a live session',
          value: 'long-lecture',
          isCorrect: false,
          settings: { imageUrl: UNSPLASH.lectureRecording }
        },
        {
          id: 1003,
          label: 'Printable PDFs only, with no knowledge checks',
          value: 'pdf-only',
          isCorrect: false,
          settings: { imageUrl: UNSPLASH.documentStack }
        },
        {
          id: 1004,
          label: 'A once-a-year company briefing with no tracked follow-up online',
          value: 'annual-only',
          isCorrect: false,
          settings: { imageUrl: UNSPLASH.townHall }
        }
      ]
    }
  },
  {
    key: QUESTION_TYPE_KEY.CHECKBOX,
    displayLabel: 'Multiple answers',
    description: 'Learners choose every correct option — ideal for “select all that apply.”',
    demoQuestion: {
      id: 'picker-checkbox',
      key: 'picker-checkbox',
      title:
        'Which of these habits most often help adults remember and apply what they learned? Select all that apply.',
      questionType: 'CHECKBOX',
      settings: {
        description: 'There is more than one correct answer.'
      },
      options: [
        {
          id: 2001,
          label: 'Revisiting key ideas on a schedule over several days or weeks',
          value: 'spaced-practice',
          isCorrect: true,
          settings: { imageUrl: UNSPLASH.notesPractice }
        },
        {
          id: 2002,
          label: 'Cramming everything the night before a deadline',
          value: 'cramming',
          isCorrect: false,
          settings: { imageUrl: UNSPLASH.focusedWork }
        },
        {
          id: 2003,
          label: 'Practicing with realistic tasks soon after the lesson',
          value: 'immediate-practice',
          isCorrect: true,
          settings: { imageUrl: UNSPLASH.teamWorkshop }
        },
        {
          id: 2004,
          label: 'Discussing takeaways with peers and comparing approaches',
          value: 'peer-discussion',
          isCorrect: true,
          settings: { imageUrl: UNSPLASH.peerDiscussion }
        }
      ]
    }
  },
  {
    key: QUESTION_TYPE_KEY.TRUE_FALSE,
    displayLabel: 'True / false',
    sidebarGlyph: 'T',
    description: 'Binary judgment — fast to answer, easy to score.',
    demoQuestion: {
      id: 'picker-true-false',
      key: 'picker-true-false',
      title:
        'Spaced practice—reviewing material over time—usually leads to better long-term retention than cramming the same amount of study into one session.',
      questionType: 'TRUE_FALSE',
      options: [
        { id: 4001, label: 'True', value: 'true', isCorrect: true },
        { id: 4002, label: 'False', value: 'false', isCorrect: false }
      ],
      settings: {
        correctValue: true
      }
    }
  },
  {
    key: QUESTION_TYPE_KEY.THUMBS,
    displayLabel: 'Thumbs up/down',
    description: 'Quick yes/no sentiment — clear icons, automatic scoring.',
    demoQuestion: {
      id: 'picker-thumbs',
      key: 'picker-thumbs',
      title: 'Would you recommend this lesson to a colleague who is new to the topic?',
      questionType: 'THUMBS',
      options: [
        { id: 14001, label: 'Yes', value: 'true', isCorrect: true },
        { id: 14002, label: 'No', value: 'false', isCorrect: false }
      ],
      settings: {
        correctValue: true
      }
    }
  },
  {
    key: QUESTION_TYPE_KEY.SHORT_ANSWER,
    displayLabel: 'Short answer',
    sidebarGlyph: 'A',
    description: 'Brief free text — ideal for definitions and one-line explanations.',
    demoQuestion: {
      id: 'picker-short-answer',
      key: 'picker-short-answer',
      title:
        'In instructional design, what do we call a concise statement that describes what a learner will be able to do after a lesson? (One or two words.)',
      questionType: 'SHORT_ANSWER',
      settings: {
        instructions: 'Use the term educators often write at the top of a lesson plan.',
        acceptedAnswers: 'learning objective,objective,learning outcome,outcome'
      }
    }
  },
  {
    key: QUESTION_TYPE_KEY.TEXTAREA,
    displayLabel: 'Long answer',
    sidebarGlyph: '\u00B6',
    description: 'Paragraph responses — rubrics and manual review when you need depth.',
    demoQuestion: {
      id: 'picker-textarea',
      key: 'picker-textarea',
      title:
        'You are launching a customer service course for new hires. In a short paragraph, describe two ways you would use feedback loops so learners improve before they go live with customers.',
      questionType: 'TEXTAREA',
      settings: {
        description: 'Aim for 2–4 sentences (about 40–220 characters).',
        minCharacters: 40,
        maxCharacters: 220
      }
    }
  },
  {
    key: QUESTION_TYPE_KEY.NUMERIC,
    displayLabel: 'Numeric',
    sidebarGlyph: '#',
    description: 'Numbers with optional tolerance — perfect for STEM and data tasks.',
    demoQuestion: {
      id: 'picker-numeric',
      key: 'picker-numeric',
      title:
        'A certification exam allows 90 minutes of working time. How many hours is that? (Enter a decimal—e.g. 1.5 for one and a half hours.)',
      questionType: 'NUMERIC',
      settings: { correctValue: 1.5, tolerance: 0 }
    }
  },
  {
    key: QUESTION_TYPE_KEY.FILL_BLANK,
    displayLabel: 'Fill in blank',
    sidebarGlyph: '_',
    description: 'Cloze-style prompts — quick checks of vocabulary and facts.',
    demoQuestion: {
      id: 'picker-fill-blank',
      key: 'picker-fill-blank',
      title:
        'Every strong course begins with a ___ of learner needs, then aligns ___ and practice activities to stated goals.',
      questionType: 'FILL_BLANK',
      settings: { acceptedAnswers: 'analysis,content' }
    }
  },
  {
    key: QUESTION_TYPE_KEY.WORD_BANK,
    displayLabel: 'Word bank',
    description: 'Drag-and-drop terms — engaging without giving away the answer.',
    demoQuestion: {
      id: 'picker-word-bank',
      key: 'picker-word-bank',
      title: 'Complete the sentence with the correct terms from the word bank.',
      questionType: 'WORD_BANK',
      settings: {
        template:
          'A well-designed lesson ___ states the goal up front, builds in timely ___, and closes with a quick check for ___.',
        correctAnswers: ['objective', 'feedback', 'understanding'],
        distractors: ['deadline', 'marketing', 'entertainment']
      }
    }
  },
  {
    key: QUESTION_TYPE_KEY.ORDERING,
    displayLabel: 'Ordering',
    description: 'Sequence steps — ideal for processes, timelines, and procedures.',
    demoQuestion: {
      id: 'picker-ordering',
      key: 'picker-ordering',
      title: 'Put these steps in the order you would run a typical training pilot before a company-wide rollout.',
      questionType: 'ORDERING',
      options: [
        { id: 'order-1', label: 'Confirm goals and success metrics with stakeholders', value: 'order-1' },
        { id: 'order-2', label: 'Run a small pilot with one team and collect feedback', value: 'order-2' },
        { id: 'order-3', label: 'Revise content and assessments based on pilot results', value: 'order-3' },
        { id: 'order-4', label: 'Launch to all eligible employees with support resources', value: 'order-4' }
      ],
      settings: {}
    }
  },
  {
    key: QUESTION_TYPE_KEY.FILE_UPLOAD,
    displayLabel: 'File upload',
    description: 'Collect documents and artifacts — great for assignments and portfolios.',
    demoQuestion: {
      id: 'picker-file-upload',
      key: 'picker-file-upload',
      title:
        'Upload your one-page training outline (PDF or Word). Include the topic, target audience, and three learning objectives.',
      questionType: 'FILE_UPLOAD',
      settings: {
        acceptedTypes: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword'
        ],
        maxSizeMb: 10
      }
    }
  },
  {
    key: QUESTION_TYPE_KEY.LINK,
    displayLabel: 'Link',
    description: 'Learners share URLs — useful for references, portfolios, and research.',
    demoQuestion: {
      id: 'picker-link',
      key: 'picker-link',
      title:
        'Share one reputable article, talk, or resource that shaped how you designed your lesson. Paste a full https:// link.',
      questionType: 'LINK',
      settings: {
        instructions: 'Use a stable URL (avoid expiring share links when possible).'
      }
    }
  },
  {
    key: QUESTION_TYPE_KEY.STAR,
    displayLabel: 'Star rating',
    description: 'Quick sentiment — lightweight feedback on clarity or difficulty.',
    demoQuestion: {
      id: 'picker-star',
      key: 'picker-star',
      title: 'How clear were this module’s outcomes and expectations before you started the activities?',
      questionType: 'STAR',
      settings: { correctValue: 4, maxStars: 5 }
    }
  },
  {
    key: QUESTION_TYPE_KEY.VIDEO_RECORDING,
    displayLabel: 'Video recording',
    description: 'Learners record a short camera response — useful for reflection, speaking, and demos.',
    demoQuestion: {
      id: 'picker-video-recording',
      key: 'picker-video-recording',
      title: 'Record a short reflection explaining one idea from this module that you would apply at work.',
      questionType: 'VIDEO_RECORDING',
      settings: {
        description: 'Keep it concise. You can retake before submitting.',
        maxDurationSeconds: 120,
        allowRetakes: true
      }
    }
  }
];

export const QUESTION_TYPE_PICKER_ITEMS = QUESTION_TYPE_PICKER_ENTRIES.filter(
  (entry) => !HIDDEN_QUESTION_TYPE_KEYS.has(entry.key)
);

export function getQuestionTypePickerItem(key: QuestionTypeKey): QuestionTypePickerEntry | undefined {
  return QUESTION_TYPE_PICKER_ITEMS.find((item) => item.key === key);
}
