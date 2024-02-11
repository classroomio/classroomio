import dayjs from 'dayjs';
import isYesterday from 'dayjs/plugin/isYesterday';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(isYesterday);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.extend(localizedFormat);

export default function formatTime(utcTimestamp: string) {
  if (!utcTimestamp) return '';

  const createdDate = dayjs(utcTimestamp);

  if (createdDate.isToday()) {
    return createdDate.format('LT');
  } else if (createdDate.isYesterday()) {
    return `Yesterday ${createdDate.format('LT')}`;
  }

  return createdDate.format('llll');
}
