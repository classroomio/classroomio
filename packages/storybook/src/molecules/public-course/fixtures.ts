import type {
  PublicCourseCalloutData,
  PublicCourseOrgData,
  PublicCourseSidebarSection,
  PublicExerciseViewData,
  PublicLessonViewData
} from '@cio/ui/custom/public-course';
import type { ExerciseQuestionModel } from '@cio/question-types';

export const CALLOUT_FIXTURE: PublicCourseCalloutData = {
  title: 'Want to go deeper on this?',
  description: 'Join the full "AI for Builders" cohort where we ship a production-grade RAG pipeline in 4 weeks.',
  buttonLabel: 'Read more on my site',
  buttonUrl: 'https://example.com/ai-for-builders'
};

export const ORG_FIXTURE: PublicCourseOrgData = {
  id: 'org-1',
  name: 'ClassroomIO',
  siteName: 'classroomio',
  avatarUrl: 'https://avatars.githubusercontent.com/u/119528464?s=200&v=4'
};

export const COURSE_TITLE_FIXTURE = 'AI for Builders — Crash Course';

export const SIDEBAR_FIXTURE: PublicCourseSidebarSection[] = [
  {
    id: 'section-intro',
    title: 'Getting started',
    items: [
      {
        kind: 'lesson',
        id: 'lesson-welcome',
        slug: 'welcome',
        title: 'Welcome to the course',
        isUnlocked: true
      },
      {
        kind: 'lesson',
        id: 'lesson-setup',
        slug: 'setting-up-your-environment',
        title: 'Setting up your environment',
        isUnlocked: true
      }
    ]
  },
  {
    id: 'section-foundations',
    title: 'Foundations',
    items: [
      {
        kind: 'lesson',
        id: 'lesson-intro-llms',
        slug: 'intro-to-large-language-models',
        title: 'Intro to large language models',
        isUnlocked: true
      },
      {
        kind: 'lesson',
        id: 'lesson-hallucinations',
        slug: 'hallucination-and-limitations',
        title: 'Hallucination & limitations',
        isUnlocked: true
      },
      {
        kind: 'exercise',
        id: 'exercise-foundations-quiz',
        slug: 'foundations-quiz',
        title: 'Foundations quiz',
        isUnlocked: true
      }
    ]
  },
  {
    id: 'section-advanced',
    title: 'Advanced',
    items: [
      {
        kind: 'lesson',
        id: 'lesson-rag',
        slug: 'retrieval-augmented-generation',
        title: 'Retrieval-augmented generation',
        isUnlocked: false
      },
      {
        kind: 'lesson',
        id: 'lesson-agents',
        slug: 'building-agents',
        title: 'Building agents',
        isUnlocked: false
      }
    ]
  }
];

export const LESSON_FIXTURE: PublicLessonViewData = {
  kind: 'lesson',
  title: 'Hallucination & limitations',
  sectionTitle: 'Foundations',
  body: `
    <p>Large language models are incredibly capable, but they also confidently produce incorrect answers — what the field calls <em>hallucination</em>. Before we design systems around them, it helps to build an intuition for where they fail.</p>
    <h2>When LLMs hallucinate</h2>
    <ul>
      <li>When asked about things outside of their training distribution.</li>
      <li>When prompted with ambiguous or leading questions.</li>
      <li>When asked to cite sources without retrieval grounding.</li>
    </ul>
    <p>In the next lessons we'll cover concrete mitigations, including retrieval, tool use, and structured outputs.</p>
  `,
  video: {
    type: 'youtube',
    link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  isUnlocked: true
};

export const LESSON_LOCKED_FIXTURE: PublicLessonViewData = {
  ...LESSON_FIXTURE,
  title: 'Building agents',
  isUnlocked: false,
  video: null,
  body: ''
};

const EXERCISE_QUESTION_FIXTURES: ExerciseQuestionModel[] = [
  {
    id: 'q-radio-1',
    title: 'Which of these is the clearest sign of hallucination?',
    questionType: 'RADIO',
    points: 1,
    options: [
      { id: 'a', label: 'The model refuses to answer a question it doesn’t know.', isCorrect: false },
      { id: 'b', label: 'The model confidently invents a fact that doesn’t exist.', isCorrect: true },
      { id: 'c', label: 'The model cites a source verbatim.', isCorrect: false }
    ]
  },
  {
    id: 'q-checkbox-1',
    title: 'Pick every mitigation that grounds an LLM in real data.',
    questionType: 'CHECKBOX',
    points: 2,
    options: [
      { id: 'a', label: 'Retrieval-augmented generation', isCorrect: true },
      { id: 'b', label: 'Turning up temperature', isCorrect: false },
      { id: 'c', label: 'Calling a tool / function', isCorrect: true },
      { id: 'd', label: 'Asking the model to be more confident', isCorrect: false }
    ]
  },
  {
    id: 'q-tf-1',
    title: 'LLMs always know when they’re wrong.',
    questionType: 'TRUE_FALSE',
    points: 1,
    options: [
      { id: 'true-option', label: 'True', value: 'true', isCorrect: false },
      { id: 'false-option', label: 'False', value: 'false', isCorrect: true }
    ]
  },
  {
    id: 'q-short-1',
    title: 'What’s the shorthand term for "retrieval-augmented generation"?',
    questionType: 'SHORT_ANSWER',
    points: 1,
    options: [
      { id: 'rag-1', label: 'rag', isCorrect: true },
      { id: 'rag-2', label: 'RAG', isCorrect: true }
    ],
    settings: { caseSensitive: false }
  },
  {
    id: 'q-numeric-1',
    title: 'How many mitigations did we cover in this lesson? (A number is fine.)',
    questionType: 'NUMERIC',
    points: 1,
    options: [{ id: 'three', label: '3', value: '3', isCorrect: true }],
    settings: { tolerance: 0 }
  }
];

export const EXERCISE_FIXTURE: PublicExerciseViewData = {
  kind: 'exercise',
  title: 'Foundations quiz',
  description: 'A short check-in on the foundations we just covered. Graded instantly in your browser.',
  sectionTitle: 'Foundations',
  isUnlocked: true,
  questions: EXERCISE_QUESTION_FIXTURES
};
