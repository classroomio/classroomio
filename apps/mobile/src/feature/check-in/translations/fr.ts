import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const fr: TranslatedMessages<typeof en> = {
  screenTitle: 'S’enregistrer',
  checkIn: 'S’enregistrer',
  checkingIn: 'Enregistrement en cours',
  checkedInTitle: 'Vous êtes enregistré',
  checkedInLateTitle: 'Vous êtes enregistré en retard',
  checkedInAt: 'Enregistré à {time}',
  openLesson: 'Ouvrir la leçon',
  scanAgain: 'Scanner à nouveau',
  scanTitle: 'Scannez le code d’enregistrement',
  scanDescription: 'Pointez l’appareil photo vers le code QR affiché par votre formateur.',
  viewfinderA11y: 'Vue de l’appareil photo pour scanner le code QR d’enregistrement',
  typeCodeTitle: 'Ou saisissez le code',
  codeLabel: 'Code d’enregistrement',
  codeDescription: '6 lettres et chiffres, affichés sous le code QR.',
  typeCodeFromLesson: 'Pour saisir un code, ouvrez la leçon de la séance et choisissez S’enregistrer.',
  cameraTitle: 'Autoriser l’appareil photo',
  cameraExplanation: 'L’appareil photo lit le code QR d’enregistrement. Aucune photo ni vidéo n’est prise.',
  cameraBlocked:
    'L’accès à l’appareil photo est désactivé pour ClassroomIO. Activez-le dans Réglages, ou saisissez le code.',
  allowCamera: 'Autoriser l’appareil photo',
  openSettings: 'Ouvrir Réglages',
  notCheckInCode: 'Ce code QR n’est pas un code d’enregistrement ClassroomIO.',
  errorInvalidTitle: 'Ce code n’a pas fonctionné',
  errorInvalid:
    'Vérifiez le code avec votre formateur. Un code cesse de fonctionner quand le formateur en crée un nouveau.',
  errorExpiredTitle: 'Ce code a expiré',
  errorExpired: 'Demandez à votre formateur d’afficher un nouveau code.',
  errorNotEnrolledTitle: 'Vous n’êtes pas apprenant de ce cours',
  errorNotEnrolled: 'Seuls les apprenants inscrits au cours peuvent s’enregistrer.',
  errorNotFoundTitle: 'Séance introuvable',
  errorNotFound:
    'La séance n’appartient pas à votre organisation actuelle. Changez d’organisation dans Profil, puis scannez à nouveau.',
  errorRateLimitedTitle: 'Trop de tentatives',
  errorRateLimited: 'Patientez quelques minutes, puis réessayez.',
  errorGenericTitle: 'L’enregistrement n’a pas abouti',
  errorLinkTitle: 'Ce lien n’est pas un code d’enregistrement',
  errorLink: 'Scannez le code QR affiché par votre formateur, ou saisissez le code depuis la leçon.'
};
