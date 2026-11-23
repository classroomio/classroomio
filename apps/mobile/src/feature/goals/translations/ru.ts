import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  streakDays: {
    one: 'Серия: {count} день',
    few: 'Серия: {count} дня',
    many: 'Серия: {count} дней',
    other: 'Серия: {count} дня'
  },
  noStreak: 'Серии пока нет',
  noStreakDescription: 'Пройдите урок, отправьте задание или посетите онлайн-занятие, чтобы начать серию.',
  activeToday: 'Сегодня вы уже учились.',
  notActiveToday: 'Позанимайтесь сегодня, чтобы сохранить серию.',
  bestStreak: {
    one: 'Рекорд: {count} день',
    few: 'Рекорд: {count} дня',
    many: 'Рекорд: {count} дней',
    other: 'Рекорд: {count} дня'
  },
  weekendNote: 'Выходные не прерывают серию.',
  dayActive: '{day}, есть занятия',
  dayInactive: '{day}, без занятий',
  weeklyTitle: 'Цель уроков на неделю',
  weeklyProgress: '{completed} из {target} уроков на этой неделе',
  weeklyReached: 'Вы достигли цели на этой неделе.',
  targetLabel: {
    one: '{count} урок в неделю',
    few: '{count} урока в неделю',
    many: '{count} уроков в неделю',
    other: '{count} урока в неделю'
  },
  lowerTarget: 'Уменьшить цель на неделю',
  raiseTarget: 'Увеличить цель на неделю',
  goalNotSaved: 'Цель на неделю не сохранена',
  milestonesTitle: 'Достижения',
  milestoneName: {
    one: 'Серия в {count} день',
    few: 'Серия в {count} дня',
    many: 'Серия в {count} дней',
    other: 'Серия в {count} дня'
  },
  milestoneAchieved: 'Получено',
  milestoneRemaining: {
    one: 'Остался {count} день',
    few: 'Осталось {count} дня',
    many: 'Осталось {count} дней',
    other: 'Осталось {count} дня'
  },
  streakUnit: { one: 'день подряд', few: 'дня подряд', many: 'дней подряд', other: 'дня подряд' },
  weeklyRemaining: {
    one: 'До цели остался {count} урок.',
    few: 'До цели осталось {count} урока.',
    many: 'До цели осталось {count} уроков.',
    other: 'До цели осталось {count} урока.'
  },
  ofTarget: 'из {target}',
  nextMilestoneTitle: 'Следующее достижение',
  milestoneProgress: {
    one: '{current} из {count} дня',
    few: '{current} из {count} дней',
    many: '{current} из {count} дней',
    other: '{current} из {count} дня'
  },
  allMilestonesEarned: 'Вы получили все достижения.',
  loadError: 'Цели не загрузились',
  welcomeTitle: {
    one: 'Серия: {count} день',
    few: 'Серия: {count} дня',
    many: 'Серия: {count} дней',
    other: 'Серия: {count} дня'
  },
  welcomeDescription: 'Позанимайтесь сегодня, чтобы продолжить её.',
  welcomeDescriptionActive: 'Сегодня вы уже занимались.',
  welcomeResume: 'Продолжить с того же места',
  welcomeExplore: 'Найти новые курсы',
  welcomeDismiss: 'Закрыть'
};
