import { KeyIcon } from 'phosphor-react-native/src/icons/Key';
import { useState } from 'react';

import { requestPasswordReset } from '@/feature/auth/api/password-reset';
import { useAuth } from '@/feature/auth/components/auth-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '@/feature/common/components/alert-dialog';
import {
  Item,
  ItemActions,
  ItemChevron,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { IconTile } from '@/feature/common/components/icon-tile';
import { accountCatalog } from '@/feature/account/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export function ChangePasswordItem({ email }: { email: string }) {
  const { client } = useAuth();
  const t = useTranslations(accountCatalog);
  const { colors } = useTheme();
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);

    try {
      await requestPasswordReset(client, email);
      setConfirming(false);
      showToast({ tone: 'success', title: t('resetSent'), description: t('resetSentDescription', { email }) });
    } catch (cause) {
      showToast({ tone: 'danger', title: t('resetFailed'), description: errorMessage(cause) });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Item onPress={() => setConfirming(true)}>
        <ItemMedia>
          <IconTile icon={KeyIcon} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{t('changePassword')}</ItemTitle>
          <ItemDescription>{t('changePasswordDescription')}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <ItemChevron />
        </ItemActions>
      </Item>

      <AlertDialog open={confirming} onOpenChange={setConfirming} busy={sending}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('changePasswordTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('changePasswordBody', { email })}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction loading={sending} onPress={send}>
              {t('sendLink')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
