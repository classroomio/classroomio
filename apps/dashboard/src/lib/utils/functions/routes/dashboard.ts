import dayjs from 'dayjs';
import isYesterday from 'dayjs/plugin/isYesterday';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';

import type { UserLessonDataType, LessonsByMonthIndexType } from '$lib/utils/types';

dayjs.extend(isYesterday);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);

export const formatUserUpcomingData = (data: UserLessonDataType[]): LessonsByMonthIndexType => {
  const result: LessonsByMonthIndexType = {};

  for (const item of data) {
    const { lesson_at } = item;
    const lessonAtDate = new Date(lesson_at);
    const monthIndex = lessonAtDate.getMonth();
    const dateIndex = lessonAtDate.getDate();

    if (result[monthIndex]) {
      const prevDateData = result[monthIndex][dateIndex];

      if (Array.isArray(prevDateData)) {
        result[monthIndex] = {
          ...result[monthIndex],
          [dateIndex]: [...prevDateData, item]
        };
      } else {
        result[monthIndex] = { ...result[monthIndex], [dateIndex]: [item] };
      }
    } else {
      result[monthIndex] = { [dateIndex]: [item] };
    }
  }

  return result;
};

export const formatDate = (_selectedDate: string | undefined): string => {
  if (!_selectedDate) return '';

  const selectedDate = dayjs(_selectedDate);

  if (selectedDate.isToday()) {
    return 'Today';
  } else if (selectedDate.isYesterday()) {
    return 'Yesterday';
  } else if (selectedDate.isTomorrow()) {
    return 'Tomorrow';
  }

  return selectedDate.format('ddd, MMM D');
};

export function clickOutside(node) {
  const handleClick = (event) => {
    if (node && !node.contains(event.target) && !event.defaultPrevented) {
      node.dispatchEvent(new CustomEvent('click:outside', { detail: event.target }));
    }
  };

  document.addEventListener('click', handleClick, true);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
    }
  };
}
