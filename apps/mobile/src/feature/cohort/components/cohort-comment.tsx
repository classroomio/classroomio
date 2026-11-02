import { StyleSheet, View } from 'react-native';

import { cohortCatalog } from '@/feature/cohort/translations/catalog';
import type { CohortComment as CohortCommentData } from '@/feature/cohort/types/cohort';
import { Avatar } from '@/feature/common/components/avatar';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { timeAgo } from '@/feature/common/helpers/time-ago';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const AVATAR_SIZE = 28;

export function CohortComment({ comment }: { comment: CohortCommentData }) {
  const t = useTranslations(cohortCatalog);
  const locale = useLocale();
  const author = comment.authorFullname || t('formerMember');

  return (
    <View style={styles.comment}>
      <Avatar name={author} uri={comment.authorAvatarUrl} size={AVATAR_SIZE} />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text variant="captionStrong" numberOfLines={1} style={styles.author}>
            {author}
          </Text>
          <Text variant="caption" tone="muted">
            {timeAgo(comment.createdAt, undefined, locale)}
          </Text>
        </View>
        <Text variant="body" tone="body">
          {comment.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  comment: { flexDirection: 'row', gap: SPACING.sm, paddingVertical: SPACING.sm },
  body: { flex: 1, gap: SPACING.xxs / 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  author: { flexShrink: 1 }
});
