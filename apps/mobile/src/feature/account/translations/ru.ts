import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  changePassword: 'Изменить пароль',
  changePasswordDescription: 'Пришлёт ссылку для смены пароля',
  changePasswordTitle: 'Изменить пароль?',
  changePasswordBody:
    'Мы отправим ссылку для сброса на {email}. Откройте её, чтобы задать новый пароль в браузере. На этом устройстве вы останетесь в аккаунте.',
  sendLink: 'Отправить ссылку',
  resetSent: 'Ссылка для сброса отправлена',
  resetSentDescription: 'Проверьте почту {email}.',
  resetFailed: 'Ссылка для сброса не отправлена',
  editNameTitle: 'Ваше имя',
  fullNameLabel: 'Полное имя',
  fullNamePlaceholder: 'Ваше полное имя',
  nameTooShort: {
    one: 'Введите не меньше {count} символа.',
    few: 'Введите не меньше {count} символов.',
    many: 'Введите не меньше {count} символов.',
    other: 'Введите не меньше {count} символа.'
  },
  nameDescription: 'Ваше имя отображается в курсах и на сертификатах.',
  nameUpdated: 'Имя обновлено',
  inviteTitle: 'У вас есть приглашение',
  inviteOrganization: 'Примите приглашение, чтобы присоединиться к организации.',
  inviteLink: 'Примите приглашение, чтобы присоединиться к организации, которая поделилась ссылкой.',
  inviteResource: 'Примите приглашение, чтобы присоединиться к курсу или группе, которыми с вами поделились.',
  inviteJoinAs: 'Вы присоединитесь как {email}.',
  acceptInvite: 'Принять приглашение',
  inviteAccepted: 'Приглашение принято',
  notNow: 'Не сейчас',
  addYourName: 'Укажите имя',
  statInProgress: 'В процессе',
  statCompleted: 'Завершены',
  statCertificates: 'Сертификаты',
  organization: 'Организация',
  certificates: 'Сертификаты',
  certificatesEarned: {
    one: '{count} получен',
    few: '{count} получено',
    many: '{count} получено',
    other: '{count} получено'
  },
  certificatesDescription: 'Ваши полученные сертификаты',
  downloads: 'Загрузки',
  downloadsOnDevice: '{size} на этом устройстве',
  downloadsDescription: 'Офлайн-уроки и синхронизация',
  settingsDescription: 'Имя, язык, блокировка, тема',
  signOutTitle: 'Выйти из ClassroomIO?',
  signOutDescription: 'Скачанные уроки и несинхронизированный прогресс будут удалены с этого устройства.',
  editName: 'Изменить имя',
  joinedOn: 'Дата регистрации: {date}',
  notifications: 'Уведомления',
  orgRole: '{org} · {role}',
  appVersion: 'ClassroomIO {version}',
  statInProgressEmpty: 'У вас нет курсов в процессе.',
  statCompletedEmpty: 'Вы ещё не завершили ни одного курса.',
  statCertificatesEmpty: 'Вы ещё не получили ни одного сертификата.',
  statCourseCount: { one: '{count} курс', few: '{count} курса', many: '{count} курсов', other: '{count} курса' },
  statEarnedOn: 'Получен {date}'
};
