import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  screenTitleCertificates: 'Certyfikaty',
  screenTitleCertificate: 'Certyfikat',
  statusValidNoExpiry: 'Ważny bezterminowo',
  statusExpiredOn: 'Wygasł {date}',
  statusExpiresToday: 'Wygasa dzisiaj',
  statusExpiresInDays: {
    one: 'Wygasa za {count} dzień',
    few: 'Wygasa za {count} dni',
    many: 'Wygasa za {count} dni',
    other: 'Wygasa za {count} dnia'
  },
  statusValidUntil: 'Ważny do {date}',
  summaryCount: {
    one: '{count} certyfikat',
    few: '{count} certyfikaty',
    many: '{count} certyfikatów',
    other: '{count} certyfikatu'
  },
  summaryExpiringSoon: {
    one: '{count} wkrótce wygasa',
    few: '{count} wkrótce wygasają',
    many: '{count} wkrótce wygasa',
    other: '{count} wkrótce wygasa'
  },
  listLoadError: 'Nie udało się wczytać certyfikatów',
  emptyTitle: 'Brak certyfikatów',
  emptyDescription: 'Ukończ kurs, aby otrzymać pierwszy certyfikat.',
  offlineNotice: 'Wygląda na to, że nie masz połączenia. Te certyfikaty są zapisane na tym urządzeniu.',
  sectionStillToEarn: 'Do zdobycia',
  issuedOn: 'Wydany {date}',
  savedOnThisDevice: 'Zapisany na tym urządzeniu',
  progressComplete: 'Ukończono {percent}',
  previewLabel: 'Certyfikat za kurs {course}',
  downloadUnavailableTitle: 'Pobieranie jest niedostępne',
  downloadUnavailableDescription: 'Twoja organizacja nie włączyła pobierania certyfikatów dla tego kursu.',
  downloadFailedTitle: 'Nie udało się pobrać certyfikatu',
  detailLoadError: 'Nie udało się wczytać certyfikatu',
  notFoundTitle: 'Nie znaleziono certyfikatu',
  notFoundDescription: 'Nie uzyskano certyfikatu za ten kurs.',
  sharePdf: 'Udostępnij PDF',
  saveToDevice: 'Zapisz na urządzeniu',
  retakeCourse: 'Powtórz kurs',
  factIssuedTo: 'Wydany dla',
  factIssuedBy: 'Wydany przez',
  factIssueDate: 'Data wydania',
  factExpired: 'Wygasł',
  factValidUntil: 'Ważny do',
  factCertificateId: 'Identyfikator certyfikatu',
  copyCertificateId: 'Kopiuj identyfikator certyfikatu',
  factRenewalCycle: 'Cykl odnowienia',
  factSavedOnDevice: 'Zapisany na urządzeniu',
  savedOnDeviceYes: 'Tak, otwiera się offline',
  savedOnDeviceNo: 'Jeszcze nie',
  shareDialogTitle: 'Udostępnij certyfikat',
  shareFailed: 'Nie udało się udostępnić certyfikatu',
  saved: 'Certyfikat zapisany',
  savedDescription: 'Plik PDF jest w wybranym folderze.',
  saveFailed: 'Nie udało się zapisać certyfikatu',
  idCopied: 'Skopiowano identyfikator certyfikatu',
  recipientFallback: 'Odbiorca',
  copyId: 'Kopiuj ID',
  openCourse: 'Otwórz kurs'
};
