import { EnvelopeOpenIcon } from 'phosphor-react-native/src/icons/EnvelopeOpen';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAccountQuery } from '@/feature/account/api/account';
import { useAcceptInviteMutation } from '@/feature/account/api/accept-invite';
import type { InviteKind } from '@/feature/account/types/account';
import { Button, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { errorHaptic, successHaptic } from '@/feature/common/helpers/haptics';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { accountCatalog } from '@/feature/account/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const DESCRIPTION_KEYS = {
  organization: 'inviteOrganization',
  link: 'inviteLink',
  resource: 'inviteResource'
} as const satisfies Record<InviteKind, string>;

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/home');
}

export function InviteAcceptance({ kind, token }: { kind: InviteKind; token: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslations(accountCatalog);
  const account = useAccountQuery();
  const acceptInvite = useAcceptInviteMutation(kind);
  const email = account.data?.profile.email;

  const accept = () =>
    acceptInvite.mutate(token, {
      onSuccess: () => {
        successHaptic();
        showToast({ tone: 'success', title: t('inviteAccepted') });
        router.replace('/home');
      },
      onError: () => errorHaptic()
    });

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg }
      ]}
    >
      <Empty>
        <EmptyMedia icon={EnvelopeOpenIcon} />
        <EmptyTitle>{t('inviteTitle')}</EmptyTitle>
        <EmptyDescription>
          {t(DESCRIPTION_KEYS[kind])}
          {email ? ` ${t('inviteJoinAs', { email })}` : ''}
        </EmptyDescription>
        {acceptInvite.isError && (
          <Text variant="caption" tone="danger" accessibilityLiveRegion="polite" style={styles.error}>
            {errorMessage(acceptInvite.error)}
          </Text>
        )}
        <EmptyContent>
          <View style={styles.actions}>
            <Button size="lg" disabled={acceptInvite.isPending} onPress={accept}>
              {acceptInvite.isPending ? <ButtonSpinner /> : <ButtonText>{t('acceptInvite')}</ButtonText>}
            </Button>
            <Button variant="ghost" disabled={acceptInvite.isPending} onPress={leave}>
              <ButtonText>{t('notNow')}</ButtonText>
            </Button>
          </View>
        </EmptyContent>
      </Empty>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', paddingHorizontal: GUTTER },
  error: { textAlign: 'center', maxWidth: 300 },
  actions: { alignSelf: 'stretch', gap: SPACING.xs }
});
