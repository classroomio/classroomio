import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  screenTitle: 'Zamelduj się',
  checkIn: 'Zamelduj się',
  checkingIn: 'Trwa meldowanie',
  checkedInTitle: 'Zameldowano Cię',
  checkedInLateTitle: 'Zameldowano Cię jako spóźnionego',
  checkedInAt: 'Zameldowano o {time}',
  openLesson: 'Otwórz lekcję',
  scanAgain: 'Skanuj ponownie',
  scanTitle: 'Zeskanuj kod zameldowania',
  scanDescription: 'Skieruj aparat na kod QR pokazywany przez prowadzącego.',
  viewfinderA11y: 'Podgląd aparatu do skanowania kodu QR zameldowania',
  typeCodeTitle: 'Albo wpisz kod',
  codeLabel: 'Kod zameldowania',
  codeDescription: '6 liter i cyfr pod kodem QR.',
  typeCodeFromLesson: 'Aby wpisać kod, otwórz lekcję tych zajęć i wybierz Zamelduj się.',
  cameraTitle: 'Zezwól na dostęp do aparatu',
  cameraExplanation: 'Aparat odczytuje kod QR zameldowania. Nic nie jest fotografowane ani nagrywane.',
  cameraBlocked: 'Dostęp do aparatu jest wyłączony dla ClassroomIO. Włącz go w Ustawieniach albo wpisz kod.',
  allowCamera: 'Zezwól na aparat',
  openSettings: 'Otwórz Ustawienia',
  notCheckInCode: 'Ten kod QR nie jest kodem zameldowania ClassroomIO.',
  errorInvalidTitle: 'Ten kod nie zadziałał',
  errorInvalid: 'Sprawdź kod z prowadzącym. Kod przestaje działać, gdy prowadzący utworzy nowy.',
  errorExpiredTitle: 'Ten kod wygasł',
  errorExpired: 'Poproś prowadzącego o pokazanie nowego kodu.',
  errorNotEnrolledTitle: 'Nie jesteś uczestnikiem tego kursu',
  errorNotEnrolled: 'Zameldować się mogą tylko uczestnicy zapisani na kurs.',
  errorNotFoundTitle: 'Nie znaleziono zajęć',
  errorNotFound:
    'Te zajęcia nie należą do Twojej bieżącej organizacji. Zmień organizację w Profilu i zeskanuj ponownie.',
  errorRateLimitedTitle: 'Zbyt wiele prób',
  errorRateLimited: 'Odczekaj kilka minut i spróbuj ponownie.',
  errorGenericTitle: 'Nie udało się zameldować',
  errorLinkTitle: 'Ten link nie jest kodem zameldowania',
  errorLink: 'Zeskanuj kod QR pokazywany przez prowadzącego albo wpisz kod w lekcji.'
};
