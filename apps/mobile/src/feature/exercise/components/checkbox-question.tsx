import { ChoiceIndicator, ChoiceItem, ChoiceLabel, ChoiceList } from '@/feature/exercise/components/choice-list';
import { useQuestionAnswer } from '@/feature/exercise/components/exercise-session';
import { activeOptionsOf, plainTextOf } from '@/feature/exercise/helpers/question-model';
import type { ExerciseQuestion } from '@/feature/exercise/types/exercise';

export function CheckboxQuestion({ question }: { question: ExerciseQuestion }) {
  const { answer, setAnswer } = useQuestionAnswer(question, 'CHECKBOX');
  const selectedIds = answer?.optionIds ?? [];

  const toggle = (optionId: number) => {
    const next = selectedIds.includes(optionId)
      ? selectedIds.filter((id) => id !== optionId)
      : [...selectedIds, optionId];

    setAnswer(next.length > 0 ? { type: 'CHECKBOX', optionIds: next } : null);
  };

  return (
    <ChoiceList mode="multiple">
      {activeOptionsOf(question).map((option) => {
        const optionId = Number(option.id);

        return (
          <ChoiceItem
            key={String(option.id)}
            selected={selectedIds.includes(optionId)}
            onPress={() => toggle(optionId)}
          >
            <ChoiceIndicator />
            <ChoiceLabel>{plainTextOf(option.label)}</ChoiceLabel>
          </ChoiceItem>
        );
      })}
    </ChoiceList>
  );
}
