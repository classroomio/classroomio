import { SmilePlus } from 'lucide-react-native';
import { createContext, use, useState, type ReactNode } from 'react';

import {
  OptionSheet,
  OptionSheetCancel,
  OptionSheetContent,
  OptionSheetItem,
  OptionSheetTitle
} from '@/feature/common/components/option-sheet';
import { PostAction } from '@/feature/common/components/post';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { REACTIONS } from '@/feature/newsfeed/constants/reactions';
import { newsfeedCatalog } from '@/feature/newsfeed/translations/catalog';
import type { ReactionRecord, ReactionType } from '@/feature/newsfeed/types/newsfeed';

type ReactionsContextValue = {
  record: ReactionRecord;
  selected: ReactionType | null;
  disabled: boolean;
  onToggle: (type: ReactionType) => void;
};

const ReactionsContext = createContext<ReactionsContextValue | null>(null);

function useReactions() {
  const context = use(ReactionsContext);
  if (!context) throw new Error('Reactions parts must be used inside Reactions');

  return context;
}

type ReactionsProps = ReactionsContextValue & { children: ReactNode };

export function Reactions({ children, ...value }: ReactionsProps) {
  return <ReactionsContext value={value}>{children}</ReactionsContext>;
}

/** One button per reaction someone has used, with its count; pressing it toggles the user's own reaction. */
export function ReactionsSummary() {
  const { record, selected, disabled, onToggle } = useReactions();
  const t = useTranslations(newsfeedCatalog);

  return REACTIONS.filter((option) => record[option.type].length > 0).map((option) => {
    const count = record[option.type].length;
    const mine = selected === option.type;

    return (
      <PostAction
        key={option.type}
        icon={option.icon}
        active={mine}
        disabled={disabled}
        onPress={() => onToggle(option.type)}
        accessibilityLabel={t(mine ? 'reactionLabelMine' : 'reactionLabel', { reaction: t(option.labelKey), count })}
      >
        {count}
      </PostAction>
    );
  });
}

export function ReactionsPicker() {
  const { selected, disabled, onToggle } = useReactions();
  const t = useTranslations(newsfeedCatalog);
  const [open, setOpen] = useState(false);

  return (
    <>
      <PostAction
        icon={SmilePlus}
        disabled={disabled}
        onPress={() => setOpen(true)}
        accessibilityLabel={t('addReaction')}
      />
      <OptionSheet open={open} onOpenChange={setOpen}>
        <OptionSheetContent>
          <OptionSheetTitle>{t('reactToPost')}</OptionSheetTitle>
          {REACTIONS.map((option) => (
            <OptionSheetItem
              key={option.type}
              icon={option.icon}
              selected={selected === option.type}
              onSelect={() => onToggle(option.type)}
            >
              {t(option.labelKey)}
            </OptionSheetItem>
          ))}
          <OptionSheetCancel />
        </OptionSheetContent>
      </OptionSheet>
    </>
  );
}
