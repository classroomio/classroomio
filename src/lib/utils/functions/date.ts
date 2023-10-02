import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const calDateDiff = (date: string | number | Date): string => {
  return dayjs(date).fromNow(true) + ` ago`;
};
