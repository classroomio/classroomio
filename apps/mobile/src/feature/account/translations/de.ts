import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const de: TranslatedMessages<typeof en> = {
  changePassword: 'Passwort ändern',
  changePasswordDescription: 'Sendet Ihnen einen Link für ein neues Passwort',
  changePasswordTitle: 'Passwort ändern?',
  changePasswordBody:
    'Wir senden einen Link zum Zurücksetzen an {email}. Öffnen Sie ihn, um im Browser ein neues Passwort festzulegen. Auf diesem Gerät bleiben Sie angemeldet.',
  sendLink: 'Link senden',
  resetSent: 'Link zum Zurücksetzen gesendet',
  resetSentDescription: 'Prüfen Sie den Posteingang von {email}.',
  resetFailed: 'Der Link zum Zurücksetzen wurde nicht gesendet',
  editNameTitle: 'Ihr Name',
  fullNameLabel: 'Vollständiger Name',
  fullNamePlaceholder: 'Ihr vollständiger Name',
  nameTooShort: {
    one: 'Geben Sie mindestens {count} Zeichen ein.',
    other: 'Geben Sie mindestens {count} Zeichen ein.'
  },
  nameDescription: 'Ihr Name erscheint in Ihren Kursen und auf Ihren Zertifikaten.',
  nameUpdated: 'Name aktualisiert',
  inviteTitle: 'Sie wurden eingeladen',
  inviteOrganization: 'Nehmen Sie die Einladung an, um der Organisation beizutreten, die Sie eingeladen hat.',
  inviteLink: 'Nehmen Sie die Einladung an, um der Organisation beizutreten, die diesen Link geteilt hat.',
  inviteResource: 'Nehmen Sie die Einladung an, um dem Kurs oder der Gruppe beizutreten, die mit Ihnen geteilt wurde.',
  inviteJoinAs: 'Sie treten als {email} bei.',
  acceptInvite: 'Einladung annehmen',
  inviteAccepted: 'Einladung angenommen',
  notNow: 'Nicht jetzt',
  addYourName: 'Namen hinzufügen',
  statInProgress: 'In Bearbeitung',
  statCompleted: 'Abgeschlossen',
  statCertificates: 'Zertifikate',
  organization: 'Organisation',
  certificates: 'Zertifikate',
  certificatesEarned: { other: '{count} erhalten' },
  certificatesDescription: 'Ihre erhaltenen Zertifikate',
  downloads: 'Downloads',
  downloadsOnDevice: '{size} auf diesem Gerät',
  downloadsDescription: 'Offline-Lektionen und Synchronisierung',
  settingsDescription: 'Name, Sprache, App-Sperre, Design',
  signOutTitle: 'Von ClassroomIO abmelden?',
  signOutDescription:
    'Heruntergeladene Lektionen und nicht synchronisierter Fortschritt werden von diesem Gerät entfernt.',
  editName: 'Namen bearbeiten',
  joinedOn: 'Dabei seit {date}',
  notifications: 'Benachrichtigungen',
  orgRole: '{org} · {role}',
  appVersion: 'ClassroomIO {version}',
  statInProgressEmpty: 'Sie haben keine laufenden Kurse.',
  statCompletedEmpty: 'Sie haben noch keinen Kurs abgeschlossen.',
  statCertificatesEmpty: 'Sie haben noch kein Zertifikat erhalten.',
  statCourseCount: { one: '{count} Kurs', other: '{count} Kurse' },
  statEarnedOn: 'Erhalten am {date}'
};
