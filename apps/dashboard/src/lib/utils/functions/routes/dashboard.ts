import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(isYesterday);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);

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
