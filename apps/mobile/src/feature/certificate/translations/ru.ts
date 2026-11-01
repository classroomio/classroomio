import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  screenTitleCertificates: 'Сертификаты',
  screenTitleCertificate: 'Сертификат',
  statusValidNoExpiry: 'Действителен бессрочно',
  statusExpiredOn: 'Истёк {date}',
  statusExpiresToday: 'Истекает сегодня',
  statusExpiresInDays: {
    one: 'Истекает через {count} день',
    few: 'Истекает через {count} дня',
    many: 'Истекает через {count} дней',
    other: 'Истекает через {count} дня'
  },
  statusValidUntil: 'Действителен до {date}',
  summaryCount: {
    one: '{count} сертификат',
    few: '{count} сертификата',
    many: '{count} сертификатов',
    other: '{count} сертификата'
  },
  summaryExpiringSoon: {
    one: '{count} скоро истекает',
    few: '{count} скоро истекают',
    many: '{count} скоро истекают',
    other: '{count} скоро истекают'
  },
  listLoadError: 'Не удалось загрузить ваши сертификаты',
  emptyTitle: 'Пока нет сертификатов',
  emptyDescription: 'Завершите курс, чтобы получить первый сертификат.',
  offlineNotice: 'Похоже, вы не в сети. Эти сертификаты сохранены на этом устройстве.',
  sectionStillToEarn: 'Ещё предстоит получить',
  issuedOn: 'Выдан {date}',
  savedOnThisDevice: 'Сохранён на этом устройстве',
  progressComplete: 'Пройдено {percent}',
  previewLabel: 'Сертификат за курс «{course}»',
  downloadUnavailableTitle: 'Скачивание недоступно',
  downloadUnavailableDescription: 'Ваша организация не включила скачивание сертификатов для этого курса.',
  downloadFailedTitle: 'Не удалось скачать сертификат',
  detailLoadError: 'Не удалось загрузить сертификат',
  notFoundTitle: 'Сертификат не найден',
  notFoundDescription: 'Вы не получили сертификат за этот курс.',
  sharePdf: 'Поделиться PDF',
  saveToDevice: 'Сохранить на устройство',
  retakeCourse: 'Пройти курс заново',
  factIssuedTo: 'Кому выдан',
  factIssuedBy: 'Кем выдан',
  factIssueDate: 'Дата выдачи',
  factExpired: 'Истёк',
  factValidUntil: 'Действителен до',
  factCertificateId: 'ID сертификата',
  copyCertificateId: 'Скопировать ID сертификата',
  factRenewalCycle: 'Цикл продления',
  factSavedOnDevice: 'Сохранён на устройстве',
  savedOnDeviceYes: 'Да, открывается офлайн',
  savedOnDeviceNo: 'Ещё нет',
  shareDialogTitle: 'Поделиться сертификатом',
  shareFailed: 'Не удалось поделиться сертификатом',
  saved: 'Сертификат сохранён',
  savedDescription: 'PDF-файл находится в выбранной папке.',
  saveFailed: 'Не удалось сохранить сертификат',
  idCopied: 'ID сертификата скопирован',
  recipientFallback: 'Получатель'
};
