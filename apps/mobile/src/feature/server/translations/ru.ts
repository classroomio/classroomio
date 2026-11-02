import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  title: 'Сервер',
  description:
    'Организации на собственном сервере используют свой API ClassroomIO. Укажите адрес, который дал администратор.',
  addressLabel: 'Адрес API',
  addressPlaceholder: 'api.yourcompany.com',
  currently: 'Сейчас: {host}',
  connect: 'Подключиться',
  useCloud: 'Использовать облако ClassroomIO',
  updated: 'Сервер изменён',
  unusable: 'Этот сервер нельзя использовать.',
  unreachable: 'Не удалось подключиться к серверу. Проверьте адрес и подключение.',
  notClassroomio: 'По этому адресу не отвечает сервер ClassroomIO.'
};
