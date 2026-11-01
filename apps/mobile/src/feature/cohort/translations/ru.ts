import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  cohorts: 'Когорты',
  cohortCount: { one: '{count} когорта', few: '{count} когорты', many: '{count} когорт', other: '{count} когорты' },
  courseCount: { one: '{count} курс', few: '{count} курса', many: '{count} курсов', other: '{count} курса' },
  learnerCount: {
    one: '{count} слушатель',
    few: '{count} слушателя',
    many: '{count} слушателей',
    other: '{count} слушателя'
  },
  peopleCount: { one: '{count} человек', few: '{count} человека', many: '{count} человек', other: '{count} человека' },
  cohortsLoadError: 'Не удалось загрузить ваши когорты',
  cohortLoadError: 'Не удалось загрузить когорту',
  noCohortsTitle: 'Когорт нет',
  noCohortsDescription: 'Вы не состоите ни в одной когорте этой организации.',
  goals: 'Цели',
  goalProgress: 'Выполнено {completed} из {required}',
  goalDue: 'Срок {date}, {relative}',
  goalNotStarted: 'Не начато',
  goalInProgress: 'В процессе',
  goalCompleted: 'Выполнено',
  goalAtRisk: 'Под угрозой',
  goalOverdue: 'Просрочено',
  goalWaived: 'Освобождено',
  courses: 'Курсы',
  announcements: 'Объявления',
  announcement: 'Объявление',
  seeAll: 'Показать все',
  noAnnouncementsTitle: 'Объявлений нет',
  noAnnouncementsDescription: 'Команда когорты ещё не публиковала объявлений.',
  announcementsLoadError: 'Не удалось загрузить объявления',
  cohortTeam: 'Команда когорты',
  formerMember: 'Бывший участник',
  announcementBy: 'Объявление от {author}',
  pinned: 'Закреплено',
  commentCount: {
    one: '{count} комментарий',
    few: '{count} комментария',
    many: '{count} комментариев',
    other: '{count} комментария'
  },
  comments: 'Комментарии',
  noCommentsYet: 'Комментариев пока нет.',
  commentsLoadError: 'Не удалось загрузить комментарии',
  writeComment: 'Напишите комментарий',
  commentInputLabel: 'Комментарий',
  postComment: 'Опубликовать комментарий',
  commentFailed: 'Комментарий не опубликован',
  commentOfflineTitle: 'Нет подключения к интернету',
  commentOfflineDescription: 'Подключитесь к интернету, чтобы оставить комментарий.',
  reactionFailed: 'Реакция не сохранена',
  announcementMissing: 'Это объявление больше недоступно'
};
