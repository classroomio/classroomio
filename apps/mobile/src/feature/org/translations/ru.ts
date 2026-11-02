import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  roleAdmin: 'Администратор',
  roleTutor: 'Преподаватель',
  roleStudent: 'Учащийся',
  roleMember: 'Участник',
  loadError: 'Не удалось загрузить ваши организации',
  noOrgTitle: 'Пока нет организации',
  noOrgDescription:
    'Этот аккаунт не состоит ни в одной организации. Попросите администратора обучения пригласить вас, затем войдите снова.',
  chooseTitle: 'Выберите организацию',
  chooseDescription: 'Сменить организацию можно позже в профиле.'
};
