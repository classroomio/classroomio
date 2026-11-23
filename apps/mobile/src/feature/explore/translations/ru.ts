import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  emptyTitle: 'Других курсов нет',
  emptyDescription: 'Ваша организация не открыла для вас другие курсы.',
  loadError: 'Не удалось загрузить курсы',
  courseLoadError: 'Не удалось загрузить курс',
  about: 'О курсе',
  goals: 'Чему вы научитесь',
  requirements: 'Требования',
  enroll: 'Записаться',
  goToCourse: 'Перейти к курсу',
  enrolledToast: 'Вы записаны на курс {title}',
  enrollFailed: 'Не удалось записаться',
  enrollFull: 'Курс сейчас не принимает новых слушателей. Обратитесь в свою организацию.',
  enrollMembersOnly: 'Записаться могут только участники этой организации. Попросите приглашение у администратора.',
  enrollUnavailable: 'На этот курс нельзя записаться в приложении.',
  paidNotAvailable: 'На этот курс нельзя записаться в приложении.',
  inviteOnly: 'Ваша организация сама записывает слушателей на этот курс.',
  originalPrice: 'Исходная цена {price}',
  pathsTitle: 'Учебные треки',
  coursesTitle: 'Курсы',
  searchCatalog: 'Поиск треков и курсов'
};
