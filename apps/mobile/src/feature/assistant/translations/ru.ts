import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  title: 'Спросить ИИ',
  description: 'О ваших курсах и целях',
  emptyTitle: 'Спросите о своём обучении',
  emptyDescription: 'Спросите о курсах, ближайших сроках или о том, как достичь цели на неделю.',
  placeholder: 'Задайте вопрос',
  inputLabel: 'Вопрос ассистенту',
  send: 'Отправить',
  stop: 'Остановить ответ',
  stopped: 'Ответ прервался. Спросите ещё раз.',
  requestFailed: 'Ассистент не ответил',
  capReachedTitle: 'В этом месяце вопросы закончились',
  capReachedDescription: 'Организация задаёт, сколько вопросов может задать учащийся.',
  poolExhaustedTitle: 'Ассистент недоступен',
  poolExhaustedDescription: 'Организация исчерпала лимит ИИ на этот месяц.',
  disabledTitle: 'Ассистент отключён',
  disabledDescription: 'Организация не включила ИИ-наставника.',
  notConfiguredTitle: 'Ассистент недоступен',
  notConfiguredDescription: 'На этом сервере не настроен поставщик ИИ.',
  noCoursesTitle: 'Сначала запишитесь на курс',
  noCoursesDescription: 'Ассистент отвечает на вопросы о курсах, на которые вы записаны.'
};
