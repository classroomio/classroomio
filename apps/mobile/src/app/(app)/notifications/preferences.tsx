import {
  NotificationCategorySection,
  NotificationChannelPicker,
  NotificationPreferences,
  NotificationPreferencesFootnote,
  NotificationPreferencesStatus,
  QuietHoursSection
} from '@/feature/notifications/components/notification-preferences';
import { ScreenScrollView } from '@/feature/common/components/screen';
import { NOTIFICATION_PREFERENCE_SECTIONS } from '@/feature/notifications/constants/notifications';

export default function NotificationPreferencesScreen() {
  return (
    <NotificationPreferences>
      <ScreenScrollView>
        <NotificationPreferencesStatus />
        <NotificationChannelPicker />
        {NOTIFICATION_PREFERENCE_SECTIONS.map((section) => (
          <NotificationCategorySection key={section.title} title={section.title} categories={section.categories} />
        ))}
        <QuietHoursSection />
        <NotificationPreferencesFootnote />
      </ScreenScrollView>
    </NotificationPreferences>
  );
}
