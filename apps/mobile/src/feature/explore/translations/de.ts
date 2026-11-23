import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const de: TranslatedMessages<typeof en> = {
  emptyTitle: 'Keine weiteren Kurse',
  emptyDescription: 'Ihre Organisation bietet Ihnen keine weiteren Kurse an.',
  loadError: 'Die Kurse wurden nicht geladen',
  courseLoadError: 'Dieser Kurs wurde nicht geladen',
  about: 'Über diesen Kurs',
  goals: 'Was Sie lernen werden',
  requirements: 'Voraussetzungen',
  enroll: 'Einschreiben',
  goToCourse: 'Zum Kurs',
  enrolledToast: 'Sie sind in {title} eingeschrieben',
  enrollFailed: 'Sie wurden nicht eingeschrieben',
  enrollFull: 'Dieser Kurs nimmt derzeit keine neuen Lernenden auf. Wenden Sie sich an Ihre Organisation.',
  enrollMembersOnly:
    'Nur Mitglieder dieser Organisation können sich einschreiben. Bitten Sie einen Administrator um eine Einladung.',
  enrollUnavailable: 'Für diesen Kurs ist keine Einschreibung in der App möglich.',
  paidNotAvailable: 'Für diesen Kurs ist keine Einschreibung in der App möglich.',
  inviteOnly: 'Ihre Organisation schreibt Lernende in diesen Kurs ein.',
  originalPrice: 'Ursprünglicher Preis {price}',
  pathsTitle: 'Lernpfade',
  coursesTitle: 'Kurse',
  searchCatalog: 'Lernpfade und Kurse durchsuchen'
};
