import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { BellIcon } from 'phosphor-react-native/src/icons/Bell';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { DownloadSimpleIcon } from 'phosphor-react-native/src/icons/DownloadSimple';
import { GearIcon } from 'phosphor-react-native/src/icons/Gear';
import { MedalIcon } from 'phosphor-react-native/src/icons/Medal';
import { PlayCircleIcon } from 'phosphor-react-native/src/icons/PlayCircle';
import { SignOutIcon } from 'phosphor-react-native/src/icons/SignOut';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAccountQuery } from '@/feature/account/api/account';
import { PROFILE_COVER_HEIGHT, ProfileHero, ProfileMeta } from '@/feature/account/components/profile-hero';
import { IconTile } from '@/feature/common/components/icon-tile';
import { ProfileStat, ProfileStats } from '@/feature/account/components/profile-stats';
import { learningStatsOf } from '@/feature/account/helpers/learning-stats';
import { accountCatalog } from '@/feature/account/translations/catalog';
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
import { Avatar } from '@/feature/common/components/avatar';
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
import { PullRefreshControl } from '@/feature/common/components/pull-refresh-control';
import { ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Text } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { isLightColor } from '@/feature/common/helpers/color';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useEnrolledCoursesQuery } from '@/feature/course/api/enrolled-courses';
import { useScrollThreshold } from '@/feature/course/helpers/use-scroll-threshold';
import { useDownloadedBytes } from '@/feature/downloads/helpers/download-store';
import { formatBytes } from '@/feature/downloads/helpers/format-bytes';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { OrgList } from '@/feature/org/components/org-list';
import { ROLE_NAME_KEYS } from '@/feature/org/constants/roles';
import { setActiveOrg, useActiveOrgId } from '@/feature/org/helpers/active-org-store';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';
import { orgCatalog } from '@/feature/org/translations/catalog';
import { installedAppVersion } from '@/feature/settings/helpers/app-version';
import { settingsCatalog } from '@/feature/settings/translations/catalog';

const TAB_BAR_CLEARANCE = 72;

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const account = useAccountQuery();
  const courses = useEnrolledCoursesQuery();
  const activeOrgId = useActiveOrgId();
  const { org } = useActiveOrg();
  const { signOut } = useAuth();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const downloadedBytes = useDownloadedBytes();
  const format = useFormatters();
  const t = useTranslations(accountCatalog);
  const tc = useTranslations(commonCatalog);
  const to = useTranslations(orgCatalog);
  const ts = useTranslations(settingsCatalog);
  const profile = account.data?.profile;
  const organizations = account.data?.organizations ?? [];
  const stats = courses.data ? learningStatsOf(courses.data) : undefined;
  const joinedTime = profile?.createdAt ? parseTimestamp(profile.createdAt) : Number.NaN;
  const joinedAt = Number.isFinite(joinedTime) ? new Date(joinedTime) : null;
  const roleLabel = org ? to((org.roleId && ROLE_NAME_KEYS[org.roleId]) || 'roleMember') : null;

  const appVersion = installedAppVersion();
  const refresh = () => Promise.all([account.refetch(), courses.refetch()]);

  const coverStatusBar = isLightColor(colors.onPrimary) ? 'light' : 'dark';
  const themeStatusBar = isDark ? 'light' : 'dark';

  const scroll = useScrollThreshold(PROFILE_COVER_HEIGHT);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(scroll.past ? themeStatusBar : coverStatusBar, true);

      return () => setStatusBarStyle(themeStatusBar, true);
    }, [scroll.past, coverStatusBar, themeStatusBar])
  );

  const confirmSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    // A plain wrapper keeps the native stack from insetting the scroll view below the status bar.
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        onScroll={scroll.onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE }]}
        contentInsetAdjustmentBehavior="never"
        scrollIndicatorInsets={{ bottom: insets.bottom + TAB_BAR_CLEARANCE }}
        refreshControl={<PullRefreshControl onRefresh={refresh} tintColor={colors.onPrimary} />}
      >
        <ProfileHero
          name={profile ? profile.fullname || t('addYourName') : null}
          email={profile?.email ?? null}
          avatarUrl={profile?.avatarUrl}
          editLabel={t('editName')}
          settingsLabel={tc('settings')}
          onEdit={() => router.push('/profile/edit-name')}
          onOpenSettings={() => router.push('/profile/settings')}
          scrollY={scroll.offset}
          meta={
            org || joinedAt ? (
              <ProfileMeta>
                {org ? (
                  <View style={styles.org}>
                    <Avatar name={org.name} uri={org.avatarUrl} shape="square" size={20} />
                    <Text variant="captionStrong" tone="body" numberOfLines={1} style={styles.orgName}>
                      {roleLabel ? t('orgRole', { org: org.name, role: roleLabel }) : org.name}
                    </Text>
                  </View>
                ) : null}
                {joinedAt ? (
                  <Text variant="caption" tone="muted">
                    {t('joinedOn', { date: format.monthYear(joinedAt) })}
                  </Text>
                ) : null}
              </ProfileMeta>
            ) : null
          }
        />

        <View style={styles.sections}>
          <ProfileStats>
            <ProfileStat
              icon={PlayCircleIcon}
              tone="primary"
              label={t('statInProgress')}
              value={stats?.inProgress}
              onPress={() => router.push({ pathname: '/profile/learning', params: { kind: 'in-progress' } })}
            />
            <ProfileStat
              icon={CheckCircleIcon}
              tone="success"
              label={t('statCompleted')}
              value={stats?.completed}
              onPress={() => router.push({ pathname: '/profile/learning', params: { kind: 'completed' } })}
            />
            <ProfileStat
              icon={MedalIcon}
              tone="warning"
              label={t('statCertificates')}
              value={stats?.certificates}
              onPress={() => router.push({ pathname: '/profile/learning', params: { kind: 'certificates' } })}
            />
          </ProfileStats>

          {organizations.length > 1 && (
            <ScreenSection>
              <ScreenSectionHeader title={t('organization')} />
              <OrgList
                organizations={organizations}
                activeOrgId={activeOrgId}
                onSelect={(next) => {
                  if (next.id === activeOrgId) return;

                  selectionHaptic();
                  setActiveOrg(next.id);
                }}
              />
            </ScreenSection>
          )}

          <ItemGroup>
            <Item onPress={() => router.push('/certificates')}>
              <ItemMedia>
                <IconTile icon={MedalIcon} />
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
              <ItemMedia>
                <IconTile icon={DownloadSimpleIcon} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{t('downloads')}</ItemTitle>
                <ItemDescription>
                  {downloadedBytes > 0
                    ? t('downloadsOnDevice', { size: formatBytes(downloadedBytes, format.locale) })
                    : t('downloadsDescription')}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <ItemChevron />
              </ItemActions>
            </Item>
          </ItemGroup>

          <ItemGroup>
            <Item onPress={() => router.push('/notifications/preferences')}>
              <ItemMedia>
                <IconTile icon={BellIcon} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{t('notifications')}</ItemTitle>
                <ItemDescription>{ts('notificationsDescription')}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <ItemChevron />
              </ItemActions>
            </Item>
            <Item onPress={() => router.push('/profile/settings')}>
              <ItemMedia>
                <IconTile icon={GearIcon} />
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

          <ItemGroup>
            <Item onPress={() => setConfirmingSignOut(true)}>
              <ItemMedia>
                <View style={[styles.signOutIcon, { backgroundColor: colors.dangerTint }]}>
                  <Icon icon={SignOutIcon} size={18} tone="danger" weight="bold" />
                </View>
              </ItemMedia>
              <ItemContent>
                <ItemTitle style={{ color: colors.danger }}>{tc('signOut')}</ItemTitle>
              </ItemContent>
            </Item>
          </ItemGroup>

          {appVersion ? (
            <Text variant="micro" tone="subtle" style={styles.version}>
              {t('appVersion', { version: appVersion })}
            </Text>
          ) : null}
        </View>

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
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1 },
  sections: { paddingHorizontal: GUTTER, paddingTop: SPACING.xl, gap: SPACING.lg },
  org: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flexShrink: 1 },
  orgName: { flexShrink: 1 },
  signOutIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: RADII.input },
  version: { textAlign: 'center' }
});
