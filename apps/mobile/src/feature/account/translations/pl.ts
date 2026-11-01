import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  changePassword: 'Zmień hasło',
  changePasswordDescription: 'Wysyła link do ustawienia nowego hasła',
  changePasswordTitle: 'Zmienić hasło?',
  changePasswordBody:
    'Wyślemy link do resetowania na adres {email}. Otwórz go, aby ustawić nowe hasło w przeglądarce. Na tym urządzeniu pozostaniesz zalogowany.',
  sendLink: 'Wyślij link',
  resetSent: 'Link do resetowania wysłany',
  resetSentDescription: 'Sprawdź skrzynkę {email}.',
  resetFailed: 'Nie wysłano linku do resetowania',
  editNameTitle: 'Imię i nazwisko',
  fullNameLabel: 'Imię i nazwisko',
  fullNamePlaceholder: 'Twoje imię i nazwisko',
  nameTooShort: {
    one: 'Użyj co najmniej {count} znaku.',
    few: 'Użyj co najmniej {count} znaków.',
    many: 'Użyj co najmniej {count} znaków.',
    other: 'Użyj co najmniej {count} znaku.'
  },
  nameDescription: 'Twoje imię i nazwisko widać w kursach i na certyfikatach.',
  nameUpdated: 'Zaktualizowano imię i nazwisko',
  inviteTitle: 'Masz zaproszenie',
  inviteOrganization: 'Zaakceptuj, aby dołączyć do organizacji, która Cię zaprosiła.',
  inviteLink: 'Zaakceptuj, aby dołączyć do organizacji, która udostępniła ten link.',
  inviteResource: 'Zaakceptuj, aby dołączyć do udostępnionego Ci kursu lub grupy.',
  inviteJoinAs: 'Dołączysz jako {email}.',
  acceptInvite: 'Zaakceptuj zaproszenie',
  inviteAccepted: 'Zaproszenie zaakceptowane',
  notNow: 'Nie teraz',
  addYourName: 'Dodaj imię i nazwisko',
  statInProgress: 'W toku',
  statCompleted: 'Ukończone',
  statCertificates: 'Certyfikaty',
  organization: 'Organizacja',
  certificates: 'Certyfikaty',
  certificatesEarned: {
    one: '{count} zdobyty',
    few: '{count} zdobyte',
    many: '{count} zdobytych',
    other: '{count} zdobytego'
  },
  certificatesDescription: 'Twoje zdobyte certyfikaty',
  downloads: 'Pobrane',
  downloadsOnDevice: '{size} na tym urządzeniu',
  downloadsDescription: 'Lekcje offline i synchronizacja',
  settingsDescription: 'Imię, język, blokada, motyw',
  signOutTitle: 'Wylogować się z ClassroomIO?',
  signOutDescription: 'Pobrane lekcje i niezsynchronizowane postępy zostaną usunięte z tego urządzenia.'
};
