import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  screenTitle: 'Отметиться',
  checkIn: 'Отметиться',
  checkingIn: 'Отмечаем вас',
  checkedInTitle: 'Вы отмечены',
  checkedInLateTitle: 'Вы отмечены как опоздавший',
  checkedInAt: 'Отметка в {time}',
  openLesson: 'Открыть урок',
  scanAgain: 'Сканировать снова',
  scanTitle: 'Отсканируйте код отметки',
  scanDescription: 'Наведите камеру на QR-код, который показывает преподаватель.',
  viewfinderA11y: 'Видоискатель камеры для сканирования QR-кода отметки',
  typeCodeTitle: 'Или введите код',
  codeLabel: 'Код отметки',
  codeDescription: '6 букв и цифр под QR-кодом.',
  typeCodeFromLesson: 'Чтобы ввести код, откройте урок занятия и выберите «Отметиться».',
  cameraTitle: 'Разрешите доступ к камере',
  cameraExplanation: 'Камера считывает QR-код отметки. Ничего не фотографируется и не записывается.',
  cameraBlocked: 'Доступ к камере для ClassroomIO выключен. Включите его в Настройках или введите код.',
  allowCamera: 'Разрешить камеру',
  openSettings: 'Открыть Настройки',
  notCheckInCode: 'Этот QR-код не является кодом отметки ClassroomIO.',
  errorInvalidTitle: 'Код не подошёл',
  errorInvalid: 'Сверьте код с преподавателем. Код перестаёт действовать, когда преподаватель создаёт новый.',
  errorExpiredTitle: 'Срок действия кода истёк',
  errorExpired: 'Попросите преподавателя показать новый код.',
  errorNotEnrolledTitle: 'Вы не участник этого курса',
  errorNotEnrolled: 'Отмечаться могут только участники, записанные на курс.',
  errorNotFoundTitle: 'Занятие не найдено',
  errorNotFound:
    'Это занятие не относится к вашей текущей организации. Смените организацию в Профиле и отсканируйте снова.',
  errorRateLimitedTitle: 'Слишком много попыток',
  errorRateLimited: 'Подождите несколько минут и попробуйте снова.',
  errorGenericTitle: 'Не удалось отметиться',
  errorLinkTitle: 'Эта ссылка не является кодом отметки',
  errorLink: 'Отсканируйте QR-код преподавателя или введите код в уроке.'
};
