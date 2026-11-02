import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const it: TranslatedMessages<typeof en> = {
  screenTitle: 'Esplora',
  entryTitle: 'Esplora i corsi',
  entryDescription: 'Corsi a cui puoi iscriverti',
  searchCourses: 'Cerca corsi',
  emptyTitle: 'Nessun altro corso',
  emptyDescription: 'La tua organizzazione non ha altri corsi disponibili per te.',
  searchNoResultsTitle: 'Nessun corso corrispondente',
  searchNoResultsDescription: 'Nessun titolo di corso contiene “{query}”.',
  loadError: 'Impossibile caricare i corsi',
  courseLoadError: 'Impossibile caricare questo corso',
  about: 'Informazioni sul corso',
  goals: 'Cosa imparerai',
  requirements: 'Requisiti',
  enroll: 'Iscriviti',
  goToCourse: 'Vai al corso',
  enrolledToast: 'Sei iscritto a {title}',
  enrollFailed: 'Iscrizione non riuscita',
  enrollFull: 'Questo corso al momento non accetta nuovi studenti. Contatta la tua organizzazione.',
  enrollMembersOnly: 'Solo i membri di questa organizzazione possono iscriversi. Chiedi un invito a un amministratore.',
  enrollUnavailable: 'Non è possibile iscriversi a questo corso dall’app.',
  paidNotAvailable: 'Non è possibile iscriversi a questo corso dall’app.',
  inviteOnly: 'La tua organizzazione iscrive gli studenti a questo corso.',
  originalPrice: 'Prezzo originale {price}'
};
