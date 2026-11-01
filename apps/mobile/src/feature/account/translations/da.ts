import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const da: TranslatedMessages<typeof en> = {
  changePassword: 'Skift adgangskode',
  changePasswordDescription: 'Sender dig et link til at vælge en ny',
  changePasswordTitle: 'Vil du skifte adgangskode?',
  changePasswordBody:
    'Vi sender et nulstillingslink til {email}. Åbn det for at vælge en ny adgangskode i din browser. Du forbliver logget ind på denne enhed.',
  sendLink: 'Send link',
  resetSent: 'Nulstillingslink sendt',
  resetSentDescription: 'Tjek {email} for linket.',
  resetFailed: 'Nulstillingslinket blev ikke sendt',
  editNameTitle: 'Dit navn',
  fullNameLabel: 'Fulde navn',
  fullNamePlaceholder: 'Dit fulde navn',
  nameTooShort: { one: 'Brug mindst {count} tegn.', other: 'Brug mindst {count} tegn.' },
  nameDescription: 'Dit navn vises i dine kurser og på dine certifikater.',
  nameUpdated: 'Navnet er opdateret',
  inviteTitle: 'Du har en invitation',
  inviteOrganization: 'Accepter for at blive medlem af den organisation, der inviterede dig.',
  inviteLink: 'Accepter for at blive medlem af den organisation, der delte linket.',
  inviteResource: 'Accepter for at deltage i det kursus eller den gruppe, der blev delt med dig.',
  inviteJoinAs: 'Du bliver medlem som {email}.',
  acceptInvite: 'Accepter invitation',
  inviteAccepted: 'Invitationen er accepteret',
  notNow: 'Ikke nu',
  addYourName: 'Tilføj dit navn',
  statInProgress: 'I gang',
  statCompleted: 'Gennemført',
  statCertificates: 'Certifikater',
  organization: 'Organisation',
  certificates: 'Certifikater',
  certificatesEarned: { other: '{count} opnået' },
  certificatesDescription: 'Dine opnåede certifikater',
  downloads: 'Downloads',
  downloadsOnDevice: '{size} på denne enhed',
  downloadsDescription: 'Offline-lektioner og synkronisering',
  settingsDescription: 'Navn, sprog, app-lås, tema',
  signOutTitle: 'Vil du logge ud af ClassroomIO?',
  signOutDescription: 'Downloadede lektioner og fremskridt, der ikke er synkroniseret, fjernes fra denne enhed.'
};
