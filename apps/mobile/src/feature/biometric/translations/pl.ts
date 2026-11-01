import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  methodFingerprint: 'odcisku palca',
  methodFaceUnlock: 'rozpoznawania twarzy',
  methodBiometrics: 'biometrii',
  lockDuration: { one: '{count} minucie', few: '{count} minutach', many: '{count} minutach', other: '{count} minuty' },
  settingDescription: 'Pyta przy otwieraniu aplikacji i po {duration} w tle.',
  settingSetUp: 'Aby korzystać z odblokowywania za pomocą {method}, skonfiguruj je w ustawieniach urządzenia.',
  settingUnsupported: 'To urządzenie nie obsługuje odblokowywania biometrycznego.',
  turnOnPrompt: 'Włącz odblokowywanie za pomocą {method}',
  stillOff: 'Odblokowywanie za pomocą {method} jest nadal wyłączone',
  unlockWith: 'Odblokuj za pomocą {method}',
  offerTitle: 'Odblokowywać za pomocą {method}?',
  offerDescription:
    'ClassroomIO poprosi o potwierdzenie za pomocą {method} przy otwieraniu aplikacji i po powrocie po {duration} nieobecności. W obu przypadkach pozostajesz zalogowany. Możesz to zmienić w Ustawieniach.',
  notNow: 'Nie teraz',
  turnOn: 'Włącz',
  isOn: 'Odblokowywanie za pomocą {method} jest włączone',
  isOnDescription: 'Możesz je wyłączyć w Ustawieniach.',
  isOff: 'Odblokowywanie za pomocą {method} jest wyłączone',
  unlockPrompt: 'Odblokuj ClassroomIO',
  lockedTitle: 'ClassroomIO jest zablokowany',
  lockedDescription: 'Aby kontynuować, potwierdź tożsamość za pomocą {method}.',
  lockedDescriptionWithEmail: 'Zalogowano jako {email}. Aby kontynuować, potwierdź tożsamość za pomocą {method}.',
  errorLockout: 'Odblokowywanie za pomocą {method} jest zablokowane po zbyt wielu próbach. Użyj kodu urządzenia.',
  errorNotSetUp: 'Odblokowywanie za pomocą {method} nie jest skonfigurowane na tym urządzeniu.',
  errorNotRecognized: 'Nie rozpoznano Cię za pomocą {method}. Spróbuj ponownie.'
};
