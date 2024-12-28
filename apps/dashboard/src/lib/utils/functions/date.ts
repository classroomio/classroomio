import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const calDateDiff = (date: string | number | Date): string => {
  return dayjs(date).fromNow(true) + ` ago`;
};

export const getGreeting = () => {
  const date = new Date();
  const hours = date.getHours();
  return hours < 12
    ? 'dashboard.morning_heading'
    : hours < 18
      ? 'dashboard.afternoon_heading'
      : 'dashboard.evening_heading';
};
