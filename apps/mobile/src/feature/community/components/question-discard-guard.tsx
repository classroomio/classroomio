import { useNavigation, usePreventRemove } from 'expo-router';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '@/feature/common/components/alert-dialog';
import { communityCatalog } from '@/feature/community/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type PendingAction = Parameters<NonNullable<Parameters<typeof usePreventRemove>[1]>>[0]['data']['action'];

/** Asks before leaving the screen (cancel, swipe down or back) while `active` is true. */
export function QuestionDiscardGuard({ active }: { active: boolean }) {
  const t = useTranslations(communityCatalog);
  const navigation = useNavigation();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  usePreventRemove(active, ({ data }) => setPendingAction(data.action));

  const discard = () => {
    const action = pendingAction;
    setPendingAction(null);
    if (action) navigation.dispatch(action);
  };

  return (
    <AlertDialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
      <AlertDialogContent>
        <AlertDialogTitle>{t('discardQuestionTitle')}</AlertDialogTitle>
        <AlertDialogDescription>{t('discardQuestionDescription')}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('keepEditing')}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onPress={discard}>
            {t('discardQuestion')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
