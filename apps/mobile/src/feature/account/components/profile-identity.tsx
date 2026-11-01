import { StyleSheet, View } from 'react-native';

import type { AccountProfile } from '@/feature/account/types/account';
import { Avatar } from '@/feature/common/components/avatar';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { accountCatalog } from '@/feature/account/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export function ProfileIdentity({ profile }: { profile: AccountProfile }) {
  const t = useTranslations(accountCatalog);

  return (
    <View style={styles.identity}>
      <Avatar name={profile.fullname || profile.email || '?'} uri={profile.avatarUrl} size={56} />
      <View style={styles.copy}>
        <Text variant="title" numberOfLines={1}>
          {profile.fullname || t('addYourName')}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {profile.email}
        </Text>
      </View>
    </View>
  );
}

export function ProfileIdentitySkeleton() {
  return (
    <View style={styles.identity}>
      <Skeleton width={56} height={56} radius={28} />
      <View style={styles.copy}>
        <Skeleton width="60%" height={22} />
        <Skeleton width="80%" height={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md },
  copy: { flex: 1, gap: SPACING.xxs }
});
