import { router } from 'expo-router';
import { Award, Download, Settings } from 'lucide-react-native';
import { useState } from 'react';

import { useAccountQuery } from '@/feature/account/api/account';
import { LearningStat, LearningStats } from '@/feature/account/components/learning-stats';
import { ProfileIdentity, ProfileIdentitySkeleton } from '@/feature/account/components/profile-identity';
import { learningStatsOf } from '@/feature/account/helpers/learning-stats';
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
import { Button, ButtonText } from '@/feature/common/components/button';
import { Card } from '@/feature/common/components/card';
import { Icon } from '@/feature/common/components/icon';
import {
  Item,
  ItemActions,
  ItemChevron,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useEnrolledCoursesQuery } from '@/feature/course/api/enrolled-courses';
import { useDownloadedBytes } from '@/feature/downloads/helpers/download-store';
import { formatBytes } from '@/feature/downloads/helpers/format-bytes';
import { OrgList } from '@/feature/org/components/org-list';
import { setActiveOrg, useActiveOrgId } from '@/feature/org/helpers/active-org-store';
import { accountCatalog } from '@/feature/account/translations/catalog';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useLocale } from '@/feature/i18n/helpers/use-locale';

export default function ProfileScreen() {
  const account = useAccountQuery();
  const courses = useEnrolledCoursesQuery();
  const activeOrgId = useActiveOrgId();
  const { signOut } = useAuth();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const downloadedBytes = useDownloadedBytes();
  const t = useTranslations(accountCatalog);
  const tc = useTranslations(commonCatalog);
  const locale = useLocale();
  const profile = account.data?.profile;
  const organizations = account.data?.organizations ?? [];
  const stats = courses.data ? learningStatsOf(courses.data) : undefined;

  const refresh = () => {
    void account.refetch();
    void courses.refetch();
  };

  const confirmSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <ScreenScrollView refreshing={account.isRefetching || courses.isRefetching} onRefresh={refresh}>
      <Card>
        {profile ? <ProfileIdentity profile={profile} /> : <ProfileIdentitySkeleton />}
        <LearningStats>
          <LearningStat label={t('statInProgress')} value={stats?.inProgress} />
          <LearningStat label={t('statCompleted')} value={stats?.completed} />
          <LearningStat label={t('statCertificates')} value={stats?.certificates} />
        </LearningStats>
      </Card>

      {organizations.length > 1 && (
        <ScreenSection>
          <ScreenSectionHeader title={t('organization')} />
          <OrgList
            organizations={organizations}
            activeOrgId={activeOrgId}
            onSelect={(org) => {
              if (org.id === activeOrgId) return;

              selectionHaptic();
              setActiveOrg(org.id);
            }}
          />
        </ScreenSection>
      )}

      <ItemGroup>
        <Item onPress={() => router.push('/certificates')}>
          <ItemMedia variant="tile">
            <Icon icon={Award} size={20} tone="ink" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{t('certificates')}</ItemTitle>
            <ItemDescription>
              {stats ? t('certificatesEarned', { count: stats.certificates }) : t('certificatesDescription')}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <ItemChevron />
          </ItemActions>
        </Item>
        <Item onPress={() => router.push('/profile/downloads')}>
          <ItemMedia variant="tile">
            <Icon icon={Download} size={20} tone="ink" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{t('downloads')}</ItemTitle>
            <ItemDescription>
              {downloadedBytes > 0
                ? t('downloadsOnDevice', { size: formatBytes(downloadedBytes, locale) })
                : t('downloadsDescription')}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <ItemChevron />
          </ItemActions>
        </Item>
        <Item onPress={() => router.push('/profile/settings')}>
          <ItemMedia variant="tile">
            <Icon icon={Settings} size={20} tone="ink" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{tc('settings')}</ItemTitle>
            <ItemDescription>{t('settingsDescription')}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <ItemChevron />
          </ItemActions>
        </Item>
      </ItemGroup>

      <Button variant="outline" size="lg" onPress={() => setConfirmingSignOut(true)}>
        <ButtonText>{tc('signOut')}</ButtonText>
      </Button>

      <AlertDialog open={confirmingSignOut} onOpenChange={setConfirmingSignOut} busy={signingOut}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('signOutTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('signOutDescription')}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction variant="destructive" loading={signingOut} onPress={confirmSignOut}>
              {tc('signOut')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScreenScrollView>
  );
}
