import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const de: TranslatedMessages<typeof en> = {
  title: 'KI fragen',
  description: 'Zu Ihren Kursen und Zielen',
  emptyTitle: 'Fragen Sie zu Ihrem Lernen',
  emptyDescription: 'Fragen Sie zu Ihren Kursen, zu anstehenden Fristen oder dazu, wie Sie Ihr Wochenziel erreichen.',
  placeholder: 'Frage stellen',
  inputLabel: 'Frage an den Assistenten',
  send: 'Senden',
  stop: 'Antwort stoppen',
  stopped: 'Die Antwort wurde abgebrochen. Fragen Sie erneut.',
  requestFailed: 'Der Assistent hat nicht geantwortet',
  capReachedTitle: 'Diesen Monat keine Fragen mehr',
  capReachedDescription: 'Ihre Organisation legt fest, wie viele Fragen Lernende stellen können.',
  poolExhaustedTitle: 'Der Assistent ist nicht verfügbar',
  poolExhaustedDescription: 'Ihre Organisation hat ihr KI-Kontingent für diesen Monat aufgebraucht.',
  disabledTitle: 'Der Assistent ist deaktiviert',
  disabledDescription: 'Ihre Organisation hat den KI-Tutor nicht aktiviert.',
  notConfiguredTitle: 'Der Assistent ist nicht verfügbar',
  notConfiguredDescription: 'Auf diesem Server ist kein KI-Anbieter eingerichtet.',
  noCoursesTitle: 'Treten Sie zuerst einem Kurs bei',
  noCoursesDescription: 'Der Assistent beantwortet Fragen zu Ihren Kursen.'
};
