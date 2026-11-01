import { CheckboxQuestion } from '@/feature/exercise/components/checkbox-question';
import { FileUploadQuestion } from '@/feature/exercise/components/file-upload-question';
import { FillBlankQuestion } from '@/feature/exercise/components/fill-blank-question';
import { HotspotQuestion } from '@/feature/exercise/components/hotspot-question';
import { LinkQuestion } from '@/feature/exercise/components/link-question';
import { MatchingQuestion } from '@/feature/exercise/components/matching-question';
import { NumericQuestion } from '@/feature/exercise/components/numeric-question';
import { OrderingQuestion } from '@/feature/exercise/components/ordering-question';
import { RadioQuestion } from '@/feature/exercise/components/radio-question';
import { ShortAnswerQuestion } from '@/feature/exercise/components/short-answer-question';
import { StarQuestion } from '@/feature/exercise/components/star-question';
import { TextareaQuestion } from '@/feature/exercise/components/textarea-question';
import { ThumbsQuestion } from '@/feature/exercise/components/thumbs-question';
import { TrueFalseQuestion } from '@/feature/exercise/components/true-false-question';
import { UnsupportedQuestion } from '@/feature/exercise/components/unsupported-question';
import { VideoRecordingQuestion } from '@/feature/exercise/components/video-recording-question';
import { WordBankQuestion } from '@/feature/exercise/components/word-bank-question';
import { questionTypeOf } from '@/feature/exercise/helpers/question-model';
import type { ExerciseQuestion, QuestionTypeKey } from '@/feature/exercise/types/exercise';

type Renderer = (props: { question: ExerciseQuestion }) => React.ReactNode;

const RENDERERS: Record<QuestionTypeKey, Renderer> = {
  RADIO: RadioQuestion,
  CHECKBOX: CheckboxQuestion,
  TEXTAREA: TextareaQuestion,
  TRUE_FALSE: TrueFalseQuestion,
  SHORT_ANSWER: ShortAnswerQuestion,
  NUMERIC: NumericQuestion,
  FILL_BLANK: FillBlankQuestion,
  FILE_UPLOAD: FileUploadQuestion,
  MATCHING: MatchingQuestion,
  ORDERING: OrderingQuestion,
  HOTSPOT: HotspotQuestion,
  LINK: LinkQuestion,
  WORD_BANK: WordBankQuestion,
  STAR: StarQuestion,
  VIDEO_RECORDING: VideoRecordingQuestion,
  THUMBS: ThumbsQuestion
};

export function QuestionRenderer({ question }: { question: ExerciseQuestion }) {
  const type = questionTypeOf(question);
  const Renderer = type ? RENDERERS[type] : null;

  if (!Renderer) return <UnsupportedQuestion />;

  return <Renderer key={String(question.id)} question={question} />;
}
