import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  methodFingerprint: 'отпечатка пальца',
  methodFaceUnlock: 'распознавания лица',
  methodBiometrics: 'биометрии',
  lockDuration: { one: '{count} минуты', few: '{count} минут', many: '{count} минут', other: '{count} минуты' },
  settingDescription: 'Запрашивается при открытии приложения и после {duration} в фоне.',
  settingSetUp: 'Чтобы использовать эту функцию, настройте разблокировку с помощью {method} в настройках устройства.',
  settingUnsupported: 'Это устройство не поддерживает биометрическую разблокировку.',
  turnOnPrompt: 'Включить разблокировку с помощью {method}',
  stillOff: 'Разблокировка с помощью {method} по-прежнему выключена',
  unlockWith: 'Разблокировать с помощью {method}',
  offerTitle: 'Разблокировать с помощью {method}?',
  offerDescription:
    'ClassroomIO будет запрашивать подтверждение с помощью {method} при открытии приложения и при возвращении после {duration} отсутствия. В обоих случаях вы остаётесь в аккаунте. Это можно изменить в настройках.',
  notNow: 'Не сейчас',
  turnOn: 'Включить',
  isOn: 'Разблокировка с помощью {method} включена',
  isOnDescription: 'Её можно выключить в настройках.',
  isOff: 'Разблокировка с помощью {method} выключена',
  unlockPrompt: 'Разблокировать ClassroomIO',
  lockedTitle: 'ClassroomIO заблокирован',
  lockedDescription: 'Чтобы продолжить, подтвердите вход с помощью {method}.',
  lockedDescriptionWithEmail: 'Вы вошли как {email}. Чтобы продолжить, подтвердите вход с помощью {method}.',
  errorLockout: 'Слишком много попыток входа с помощью {method}. Введите код-пароль устройства.',
  errorNotSetUp: 'Разблокировка с помощью {method} не настроена на этом устройстве.',
  errorNotRecognized: 'Не удалось подтвердить вход с помощью {method}. Попробуйте ещё раз.'
};
