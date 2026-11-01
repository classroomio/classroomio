import { createContext, use, useRef, useState, type ReactNode } from 'react';

import { writeExerciseDraft } from '@/feature/exercise/helpers/draft-store';
import { activeQuestionsOf, questionKeyOf } from '@/feature/exercise/helpers/question-model';
import { useUploadRegistry, type UploadJob, type UploadState } from '@/feature/exercise/helpers/use-upload-registry';
import type {
  AnswerData,
  AnswerMap,
  Exercise,
  ExerciseDraft,
  ExerciseQuestion
} from '@/feature/exercise/types/exercise';

type ExerciseSessionValue = {
  courseId: string;
  exerciseId: string;
  exercise: Exercise;
  questions: ExerciseQuestion[];
  answers: AnswerMap;
  setAnswer: (questionKey: string, answer: AnswerData | null) => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  showProblems: boolean;
  setShowProblems: (show: boolean) => void;
  savedAt: number | null;
  uploads: Record<string, UploadState>;
  isUploading: boolean;
  startUpload: (questionKey: string, job: UploadJob) => void;
  retryUpload: (questionKey: string) => void;
  cancelUpload: (questionKey: string) => void;
};

const ExerciseSessionContext = createContext<ExerciseSessionValue | null>(null);

export function useExerciseSession() {
  const session = use(ExerciseSessionContext);
  if (!session) throw new Error('useExerciseSession must be used inside ExerciseSession');

  return session;
}

type ExerciseSessionProps = {
  courseId: string;
  exerciseId: string;
  exercise: Exercise;
  userId: string;
  baseAttemptCount: number;
  initialDraft: ExerciseDraft | null;
  children: ReactNode;
};

export function ExerciseSession({
  courseId,
  exerciseId,
  exercise,
  userId,
  baseAttemptCount,
  initialDraft,
  children
}: ExerciseSessionProps) {
  const questions = activeQuestionsOf(exercise);
  const [answers, setAnswers] = useState<AnswerMap>(initialDraft?.answers ?? {});
  const [currentIndex, setIndex] = useState(() =>
    Math.min(Math.max(0, initialDraft?.currentIndex ?? 0), Math.max(0, questions.length - 1))
  );
  const [showProblems, setShowProblems] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(initialDraft ? Date.parse(initialDraft.updatedAt) : null);
  const latest = useRef({ answers, currentIndex });

  const persist = (nextAnswers: AnswerMap, nextIndex: number) => {
    latest.current = { answers: nextAnswers, currentIndex: nextIndex };
    const updatedAt = new Date().toISOString();
    void writeExerciseDraft(userId, exerciseId, {
      answers: nextAnswers,
      currentIndex: nextIndex,
      baseAttemptCount,
      updatedAt
    }).then(() => setSavedAt(Date.parse(updatedAt)));
  };

  const setAnswer = (questionKey: string, answer: AnswerData | null) => {
    const next = { ...latest.current.answers };
    if (answer) next[questionKey] = answer;
    else delete next[questionKey];

    setAnswers(next);
    persist(next, latest.current.currentIndex);
  };

  const registry = useUploadRegistry(setAnswer);

  const setCurrentIndex = (index: number) => {
    const bounded = Math.min(Math.max(0, index), Math.max(0, questions.length - 1));
    setIndex(bounded);
    persist(latest.current.answers, bounded);
  };

  return (
    <ExerciseSessionContext
      value={{
        courseId,
        exerciseId,
        exercise,
        questions,
        answers,
        setAnswer,
        currentIndex,
        setCurrentIndex,
        showProblems,
        setShowProblems,
        savedAt,
        ...registry
      }}
    >
      {children}
    </ExerciseSessionContext>
  );
}

export function useQuestionAnswer<Type extends AnswerData['type']>(question: ExerciseQuestion, type: Type) {
  const { answers, setAnswer } = useExerciseSession();
  const key = questionKeyOf(question);
  const stored = answers[key];
  const answer = stored?.type === type ? (stored as Extract<AnswerData, { type: Type }>) : null;

  return {
    key,
    answer,
    setAnswer: (next: Extract<AnswerData, { type: Type }> | null) => setAnswer(key, next)
  };
}
