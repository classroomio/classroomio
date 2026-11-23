import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  title: 'Zapytaj AI',
  description: 'O Twoich kursach i celach',
  emptyTitle: 'Zapytaj o swoją naukę',
  emptyDescription: 'Zapytaj o kursy, najbliższe terminy lub o to, jak osiągnąć cel tygodniowy.',
  placeholder: 'Zadaj pytanie',
  inputLabel: 'Pytanie do asystenta',
  send: 'Wyślij',
  stop: 'Zatrzymaj odpowiedź',
  stopped: 'Odpowiedź została przerwana. Zapytaj ponownie.',
  requestFailed: 'Asystent nie odpowiedział',
  capReachedTitle: 'W tym miesiącu nie masz już pytań',
  capReachedDescription: 'Organizacja ustala, ile pytań może zadać każdy uczeń.',
  poolExhaustedTitle: 'Asystent jest niedostępny',
  poolExhaustedDescription: 'Organizacja wykorzystała limit AI na ten miesiąc.',
  disabledTitle: 'Asystent jest wyłączony',
  disabledDescription: 'Organizacja nie włączyła tutora AI.',
  notConfiguredTitle: 'Asystent jest niedostępny',
  notConfiguredDescription: 'Na tym serwerze nie skonfigurowano dostawcy AI.',
  noCoursesTitle: 'Najpierw dołącz do kursu',
  noCoursesDescription: 'Asystent odpowiada na pytania o kursy, na które jesteś zapisany.'
};
