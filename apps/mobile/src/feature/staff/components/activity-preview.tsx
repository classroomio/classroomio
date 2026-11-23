import { router } from 'expo-router';

import { Button, ButtonText } from '@/feature/common/components/button';
import { ItemGroup } from '@/feature/common/components/item';
import { ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { SkeletonList } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useTeachingActivityQuery } from '@/feature/staff/api/teaching-insights';
import { ActivityRow } from '@/feature/staff/components/activity-row';
import { staffCatalog } from '@/feature/staff/translations/catalog';

const PREVIEW = 5;

/** The newest learner events across the viewer's courses, with a link to the full feed. */
export function ActivityPreview() {
  const t = useTranslations(staffCatalog);
  const activity = useTeachingActivityQuery({ limit: PREVIEW });
  const items = activity.data?.pages[0]?.items ?? [];
  const hasMore = Boolean(activity.data?.pages[0]?.nextCursor);

  return (
    <ScreenSection>
      <ScreenSectionHeader
        title={t('recentActivity')}
        action={
          hasMore ? (
            <Button variant="ghost" size="sm" onPress={() => router.push('/home/activity')}>
              <ButtonText>{t('seeAll')}</ButtonText>
            </Button>
          ) : undefined
        }
      />
      {activity.isPending ? <SkeletonList count={3} /> : null}
      {activity.isError ? (
        <Text variant="caption" tone="danger">
          {t('activityLoadErrorInline', { error: errorMessage(activity.error) })}
        </Text>
      ) : null}
      {activity.isSuccess && items.length === 0 ? (
        <Text variant="caption" tone="muted">
          {t('noActivity')}
        </Text>
      ) : null}
      {items.length > 0 ? (
        <ItemGroup>
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </ItemGroup>
      ) : null}
    </ScreenSection>
  );
}
