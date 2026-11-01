import { router } from 'expo-router';
import { Lock, TriangleAlert, WifiOff } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { Skeleton } from '@/feature/common/components/skeleton';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';

export function LessonLocked({ reason }: { reason: string }) {
  const t = useTranslations(lessonCatalog);

  return (
    <Empty>
      <EmptyMedia icon={Lock} />
      <EmptyTitle>{t('lockedTitle')}</EmptyTitle>
      <EmptyDescription>{reason}</EmptyDescription>
      <EmptyContent>
        <Button variant="outline" onPress={() => router.back()}>
          <ButtonText>{t('backToCourse')}</ButtonText>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function LessonError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTranslations(lessonCatalog);
  const common = useTranslations(commonCatalog);

  return (
    <Empty>
      <EmptyMedia icon={TriangleAlert} />
      <EmptyTitle>{t('loadErrorTitle')}</EmptyTitle>
      <EmptyDescription>{message}</EmptyDescription>
      <EmptyContent>
        <Button variant="outline" onPress={onRetry}>
          <ButtonText>{common('retry')}</ButtonText>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function LessonNeedsConnection({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations(lessonCatalog);
  const common = useTranslations(commonCatalog);

  return (
    <Empty>
      <EmptyMedia icon={WifiOff} />
      <EmptyTitle>{t('needsConnectionTitle')}</EmptyTitle>
      <EmptyDescription>{t('needsConnectionDescription')}</EmptyDescription>
      <EmptyContent>
        <Button variant="outline" onPress={onRetry}>
          <ButtonText>{common('retry')}</ButtonText>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function LessonSkeleton() {
  return (
    <View style={styles.skeleton}>
      <Skeleton height={200} radius={RADII.lg} />
      <Skeleton height={24} width="70%" />
      <Skeleton height={14} width="40%" />
      <View style={styles.lines}>
        <Skeleton height={16} />
        <Skeleton height={16} width="94%" />
        <Skeleton height={16} width="88%" />
        <Skeleton height={16} width="60%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: { gap: SPACING.md },
  lines: { gap: SPACING.xs, marginTop: SPACING.xs }
});
