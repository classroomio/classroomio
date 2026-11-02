import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const fr: TranslatedMessages<typeof en> = {
  methodFingerprint: 'empreinte digitale',
  methodFaceUnlock: 'reconnaissance faciale',
  methodBiometrics: 'biométrie',
  lockDuration: { one: '{count} minute', other: '{count} minutes' },
  settingDescription: "Demandé à l'ouverture de l'app et après {duration} en arrière-plan.",
  settingSetUp: "Pour utiliser cette option, configurez {method} dans les réglages de l'appareil.",
  settingUnsupported: 'Cet appareil ne prend pas en charge le déverrouillage biométrique.',
  turnOnPrompt: 'Activer le déverrouillage par {method}',
  stillOff: 'Le déverrouillage par {method} reste désactivé',
  unlockWith: 'Déverrouiller avec {method}',
  offerTitle: 'Déverrouiller avec {method} ?',
  offerDescription:
    "ClassroomIO vous demandera {method} à l'ouverture de l'app et à votre retour après {duration} d'absence. Vous restez connecté dans les deux cas. Vous pouvez modifier ce choix dans Réglages.",
  notNow: 'Plus tard',
  turnOn: 'Activer',
  isOn: 'Déverrouillage par {method} activé',
  isOnDescription: 'Vous pouvez le désactiver dans Réglages.',
  isOff: 'Déverrouillage par {method} désactivé',
  unlockPrompt: 'Déverrouiller ClassroomIO',
  lockedTitle: 'ClassroomIO est verrouillé',
  lockedDescription: 'Utilisez {method} pour continuer.',
  lockedDescriptionWithEmail: 'Connecté en tant que {email}. Utilisez {method} pour continuer.',
  errorLockout: 'Trop de tentatives avec {method}. Utilisez le code de votre appareil.',
  errorNotSetUp: "Configurez d'abord {method} sur cet appareil.",
  errorNotRecognized: 'Échec de la reconnaissance par {method}. Réessayez.'
};
