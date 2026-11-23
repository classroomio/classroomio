import { BroadcastIcon } from 'phosphor-react-native/src/icons/Broadcast';
import { CalendarCheckIcon } from 'phosphor-react-native/src/icons/CalendarCheck';
import { VideoCameraIcon } from 'phosphor-react-native/src/icons/VideoCamera';

import { IconTile } from '@/feature/common/components/icon-tile';
import {
  Item,
  ItemActions,
  ItemChevron,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { Text } from '@/feature/common/components/text';
import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import type { TeachingSession } from '@/feature/staff/types/staff';

function sameDay(first: Date, second: Date) {
  return first.toDateString() === second.toDateString();
}

type SessionRowProps = { session: TeachingSession; onPress: (session: TeachingSession) => void };

/** A live session in a taught course: when it starts, its course, and how many students registered. */
export function SessionRow({ session, onPress }: SessionRowProps) {
  const t = useTranslations(staffCatalog);
  const format = useFormatters();
  const start = new Date(parseTimestamp(session.lessonAt));
  const when = sameDay(start, new Date()) ? format.time(start) : `${format.shortDate(start)}, ${format.time(start)}`;
  const registered = t('sessionRegistered', {
    registered: format.number(session.registeredCount),
    students: format.number(session.studentCount)
  });
  const status = session.isLive ? t('sessionLiveNow') : session.attendanceMarked ? t('sessionAttendanceTaken') : null;
  const icon = session.isLive ? BroadcastIcon : session.attendanceMarked ? CalendarCheckIcon : VideoCameraIcon;

  return (
    <Item
      onPress={() => onPress(session)}
      accessibilityHint={t('takeAttendance')}
      accessibilityLabel={[session.title, status, when, session.courseTitle, registered].filter(Boolean).join(', ')}
    >
      <ItemMedia>
        <IconTile icon={icon} tone={session.isLive ? 'danger' : 'neutral'} size={36} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle numberOfLines={1}>{session.title}</ItemTitle>
        <ItemDescription numberOfLines={1}>{[when, session.courseTitle].filter(Boolean).join(' · ')}</ItemDescription>
        <Text variant="caption" tone={session.isLive ? 'danger' : 'subtle'} numberOfLines={1}>
          {[status, registered].filter(Boolean).join(' · ')}
        </Text>
      </ItemContent>
      <ItemActions>
        <ItemChevron />
      </ItemActions>
    </Item>
  );
}
