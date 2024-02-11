import dayjs from 'dayjs';
import isYesterday from 'dayjs/plugin/isYesterday';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(isYesterday);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.extend(localizedFormat);

export default function formatTime(utcTimestamp:string) {
  if (!utcTimestamp) return '';

  const selectedDate = dayjs(utcTimestamp);

  if (selectedDate.isToday()) {
    return selectedDate.format('LT');
  } else if (selectedDate.isYesterday()) {
    return `Yesterday ${selectedDate.format('LT')}`;
  }

  return selectedDate.format('llll');
}
