import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const de: TranslatedMessages<typeof en> = {
  screenTitle: 'Einchecken',
  checkIn: 'Einchecken',
  checkingIn: 'Sie werden eingecheckt',
  checkedInTitle: 'Sie sind eingecheckt',
  checkedInLateTitle: 'Sie sind als verspätet eingecheckt',
  checkedInAt: 'Eingecheckt um {time}',
  openLesson: 'Lektion öffnen',
  scanAgain: 'Erneut scannen',
  scanTitle: 'Check-in-Code scannen',
  scanDescription: 'Richten Sie die Kamera auf den QR-Code, den Ihr Kursleiter zeigt.',
  viewfinderA11y: 'Kameraansicht zum Scannen des Check-in-QR-Codes',
  typeCodeTitle: 'Oder Code eingeben',
  codeLabel: 'Check-in-Code',
  codeDescription: '6 Buchstaben und Ziffern, unter dem QR-Code angezeigt.',
  typeCodeFromLesson:
    'Um stattdessen einen Code einzugeben, öffnen Sie die Lektion des Termins und wählen Sie Einchecken.',
  cameraTitle: 'Kamerazugriff erlauben',
  cameraExplanation: 'Die Kamera liest den Check-in-QR-Code. Es werden keine Fotos oder Aufnahmen gemacht.',
  cameraBlocked:
    'Der Kamerazugriff ist für ClassroomIO deaktiviert. Aktivieren Sie ihn in den Einstellungen oder geben Sie den Code ein.',
  allowCamera: 'Kamera erlauben',
  openSettings: 'Einstellungen öffnen',
  notCheckInCode: 'Dieser QR-Code ist kein Check-in-Code von ClassroomIO.',
  errorInvalidTitle: 'Dieser Code hat nicht funktioniert',
  errorInvalid:
    'Prüfen Sie den Code mit Ihrem Kursleiter. Ein Code ist ungültig, sobald der Kursleiter einen neuen erstellt.',
  errorExpiredTitle: 'Dieser Code ist abgelaufen',
  errorExpired: 'Bitten Sie Ihren Kursleiter, einen neuen Code anzuzeigen.',
  errorNotEnrolledTitle: 'Sie sind kein Teilnehmer dieses Kurses',
  errorNotEnrolled: 'Nur im Kurs eingeschriebene Teilnehmer können einchecken.',
  errorNotFoundTitle: 'Termin nicht gefunden',
  errorNotFound:
    'Der Termin gehört nicht zu Ihrer aktuellen Organisation. Wechseln Sie die Organisation unter Profil und scannen Sie erneut.',
  errorRateLimitedTitle: 'Zu viele Versuche',
  errorRateLimited: 'Warten Sie einige Minuten und versuchen Sie es dann erneut.',
  errorGenericTitle: 'Einchecken hat nicht geklappt',
  errorLinkTitle: 'Dieser Link ist kein Check-in-Code',
  errorLink: 'Scannen Sie den QR-Code Ihres Kursleiters oder geben Sie den Code in der Lektion ein.'
};
