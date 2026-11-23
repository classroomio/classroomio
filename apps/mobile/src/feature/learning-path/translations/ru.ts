import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  pathLabel: 'Учебный трек',
  courseCount: { one: '{count} курс', few: '{count} курса', many: '{count} курсов', other: '{count} курса' },
  coursesComplete: 'Пройдено курсов: {completed} из {total}',
  pathCompleted: 'Трек пройден',
  percentComplete: 'Пройдено {percent}',
  stateCompleted: 'Пройден',
  stateInProgress: 'В процессе',
  stateNotStarted: 'Не начат',
  stateLocked: 'Закрыт',
  finishToUnlock: 'Пройдите «{course}», чтобы открыть',
  inOrder: 'Курсы открываются по порядку.',
  anyOrder: 'Курсы можно проходить в любом порядке.',
  courses: 'Курсы',
  join: 'Присоединиться к треку',
  joined: 'Вы присоединились к треку «{name}»',
  joinFailed: 'Вас не добавили в трек',
  start: 'Начать',
  nextUp: 'Далее: {title}',
  notJoinableInApp: 'К этому треку нельзя присоединиться в приложении.',
  loadError: 'Учебный трек не загрузился',
  emptyTitle: 'Учебных треков пока нет',
  emptyDescription: 'Здесь перечислены треки, к которым вы присоединились, и прогресс по каждому курсу.',
  suggested: 'Рекомендуемые треки'
};
