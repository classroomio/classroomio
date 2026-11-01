import { BuildingsIcon } from 'phosphor-react-native/src/icons/Buildings';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAccountQuery } from '@/feature/account/api/account';
import { useAuth } from '@/feature/auth/components/auth-provider';
import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { OrgList } from '@/feature/org/components/org-list';
import { setActiveOrg } from '@/feature/org/helpers/active-org-store';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { orgCatalog } from '@/feature/org/translations/catalog';

export default function SelectOrgScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const t = useTranslations(orgCatalog);
  const tc = useTranslations(commonCatalog);
  const account = useAccountQuery();
  const organizations = account.data?.organizations ?? [];
  const onlyOrg = organizations.length === 1 ? organizations[0] : undefined;

  useEffect(() => {
    if (onlyOrg) setActiveOrg(onlyOrg.id);
  }, [onlyOrg]);

  if (account.isError || organizations.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Empty>
          <EmptyMedia icon={BuildingsIcon} />
          <EmptyTitle>{account.isError ? t('loadError') : t('noOrgTitle')}</EmptyTitle>
          <EmptyDescription>{account.isError ? errorMessage(account.error) : t('noOrgDescription')}</EmptyDescription>
          <EmptyContent>
            {account.isError ? (
              <Button variant="outline" onPress={() => account.refetch()}>
                <ButtonText>{tc('retry')}</ButtonText>
              </Button>
            ) : (
              <Button variant="outline" onPress={signOut}>
                <ButtonText>{tc('signOut')}</ButtonText>
              </Button>
            )}
          </EmptyContent>
        </Empty>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACING.xxl, paddingBottom: insets.bottom + SPACING.xl }
      ]}
    >
      <View style={styles.heading}>
        <Text variant="display" accessibilityRole="header">
          {t('chooseTitle')}
        </Text>
        <Text tone="muted">{t('chooseDescription')}</Text>
      </View>
      <OrgList organizations={organizations} onSelect={(org) => setActiveOrg(org.id)} />
      <Button variant="ghost" onPress={signOut}>
        <ButtonText>{tc('signOut')}</ButtonText>
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', paddingHorizontal: GUTTER },
  content: { paddingHorizontal: GUTTER, gap: SPACING.xl },
  heading: { gap: SPACING.xs }
});
