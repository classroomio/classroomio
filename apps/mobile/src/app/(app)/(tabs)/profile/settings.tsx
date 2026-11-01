import { router } from 'expo-router';
import { Bell, Info, Mail, Server, UserRound } from 'lucide-react-native';

import { useAccountQuery } from '@/feature/account/api/account';
import { ChangePasswordItem } from '@/feature/account/components/change-password-item';
import { BiometricLockSetting } from '@/feature/biometric/components/biometric-lock-setting';
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
import { useServer } from '@/feature/server/components/server-provider';
import { LanguageSetting } from '@/feature/settings/components/language-setting';
import { SettingValue } from '@/feature/settings/components/setting-value';
import { ThemePreferenceControl } from '@/feature/settings/components/theme-preference-control';
import { installedAppVersion } from '@/feature/settings/helpers/app-version';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { settingsCatalog } from '@/feature/settings/translations/catalog';

export default function SettingsScreen() {
  const account = useAccountQuery();
  const { serverUrl, isCustom } = useServer();
  const profile = account.data?.profile;
  const t = useTranslations(settingsCatalog);

  return (
    <ScreenScrollView>
      <ScreenSection>
        <ScreenSectionHeader title={t('account')} />
        <ItemGroup>
          <Item onPress={() => router.push('/profile/edit-name')}>
            <ItemMedia variant="tile">
              <Icon icon={UserRound} size={20} tone="ink" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('name')}</ItemTitle>
              <ItemDescription numberOfLines={1}>{profile?.fullname || t('notSet')}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <ItemChevron />
            </ItemActions>
          </Item>
          <Item>
            <ItemMedia variant="tile">
              <Icon icon={Mail} size={20} tone="ink" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('email')}</ItemTitle>
              <ItemDescription numberOfLines={1}>{profile?.email ?? ''}</ItemDescription>
            </ItemContent>
          </Item>
          {profile?.email ? <ChangePasswordItem email={profile.email} /> : null}
        </ItemGroup>
      </ScreenSection>

      <ScreenSection>
        <ScreenSectionHeader title={t('notifications')} />
        <ItemGroup>
          <Item onPress={() => router.push('/notifications/preferences')}>
            <ItemMedia variant="tile">
              <Icon icon={Bell} size={20} tone="ink" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('notifications')}</ItemTitle>
              <ItemDescription numberOfLines={1}>{t('notificationsDescription')}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <ItemChevron />
            </ItemActions>
          </Item>
        </ItemGroup>
      </ScreenSection>

      <ScreenSection>
        <ScreenSectionHeader title={t('security')} />
        <ItemGroup>
          <BiometricLockSetting />
        </ItemGroup>
      </ScreenSection>

      <ScreenSection>
        <ScreenSectionHeader title={t('language')} />
        <ItemGroup>
          <LanguageSetting />
        </ItemGroup>
      </ScreenSection>

      <ScreenSection>
        <ScreenSectionHeader title={t('theme')} />
        <ThemePreferenceControl />
      </ScreenSection>

      <ScreenSection>
        <ScreenSectionHeader title={t('about')} />
        <ItemGroup>
          <Item>
            <ItemMedia variant="tile">
              <Icon icon={Info} size={20} tone="ink" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('version')}</ItemTitle>
            </ItemContent>
            <ItemActions>
              <SettingValue>{installedAppVersion() ?? t('versionUnknown')}</SettingValue>
            </ItemActions>
          </Item>
          {isCustom ? (
            <Item>
              <ItemMedia variant="tile">
                <Icon icon={Server} size={20} tone="ink" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{t('server')}</ItemTitle>
                <ItemDescription numberOfLines={1}>{new URL(serverUrl).host}</ItemDescription>
                <ItemDescription>{t('serverDescription')}</ItemDescription>
              </ItemContent>
            </Item>
          ) : null}
        </ItemGroup>
      </ScreenSection>
    </ScreenScrollView>
  );
}
