import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const de: TranslatedMessages<typeof en> = {
  methodFingerprint: 'Fingerabdruck',
  methodFaceUnlock: 'Gesichtsentsperrung',
  methodBiometrics: 'Biometrie',
  lockDuration: { one: '{count} Minute', other: '{count} Minuten' },
  settingDescription: 'Fragt beim Öffnen der App und nach {duration} im Hintergrund.',
  settingSetUp: 'Richten Sie {method} in den Einstellungen Ihres Geräts ein, um die Entsperrung hier zu nutzen.',
  settingUnsupported: 'Dieses Gerät unterstützt keine biometrische Entsperrung.',
  turnOnPrompt: 'Entsperren mit {method} aktivieren',
  stillOff: 'Entsperren mit {method} ist weiterhin aus',
  unlockWith: 'Mit {method} entsperren',
  offerTitle: 'Mit {method} entsperren?',
  offerDescription:
    'ClassroomIO fragt nach {method}, wenn Sie die App öffnen und wenn Sie nach {duration} zurückkehren. Sie bleiben in jedem Fall angemeldet. Diese Einstellung können Sie jederzeit in den Einstellungen ändern.',
  notNow: 'Nicht jetzt',
  turnOn: 'Aktivieren',
  isOn: 'Entsperren mit {method} ist aktiviert',
  isOnDescription: 'Sie können die Funktion in den Einstellungen deaktivieren.',
  isOff: 'Entsperren mit {method} ist deaktiviert',
  unlockPrompt: 'ClassroomIO entsperren',
  lockedTitle: 'ClassroomIO ist gesperrt',
  lockedDescription: 'Verwenden Sie {method}, um fortzufahren.',
  lockedDescriptionWithEmail: 'Angemeldet als {email}. Verwenden Sie {method}, um fortzufahren.',
  errorLockout: '{method} ist nach zu vielen Versuchen gesperrt. Verwenden Sie den Code Ihres Geräts.',
  errorNotSetUp: '{method} ist auf diesem Gerät nicht eingerichtet.',
  errorNotRecognized: '{method} hat Sie nicht erkannt. Versuchen Sie es erneut.'
};
