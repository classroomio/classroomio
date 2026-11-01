import { ChoiceIndicator, ChoiceItem, ChoiceLabel, ChoiceList } from '@/feature/exercise/components/choice-list';
import { useQuestionAnswer } from '@/feature/exercise/components/exercise-session';
import { activeOptionsOf, plainTextOf } from '@/feature/exercise/helpers/question-model';
import type { ExerciseQuestion } from '@/feature/exercise/types/exercise';

export function RadioQuestion({ question }: { question: ExerciseQuestion }) {
  const { answer, setAnswer } = useQuestionAnswer(question, 'RADIO');

  return (
    <ChoiceList mode="single">
      {activeOptionsOf(question).map((option) => {
        const optionId = Number(option.id);

        return (
          <ChoiceItem
            key={String(option.id)}
            selected={answer?.optionId === optionId}
            onPress={() => setAnswer({ type: 'RADIO', optionId })}
          >
            <ChoiceIndicator />
            <ChoiceLabel>{plainTextOf(option.label)}</ChoiceLabel>
          </ChoiceItem>
        );
      })}
    </ChoiceList>
  );
}
