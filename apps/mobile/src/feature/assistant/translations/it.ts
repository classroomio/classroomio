import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const it: TranslatedMessages<typeof en> = {
  title: 'Chiedi all’IA',
  description: 'Sui tuoi corsi e obiettivi',
  emptyTitle: 'Chiedi del tuo apprendimento',
  emptyDescription: 'Chiedi dei tuoi corsi, delle prossime scadenze o di come raggiungere l’obiettivo settimanale.',
  placeholder: 'Fai una domanda',
  inputLabel: 'Domanda per l’assistente',
  send: 'Invia',
  stop: 'Interrompi risposta',
  stopped: 'La risposta si è interrotta. Chiedi di nuovo.',
  requestFailed: 'L’assistente non ha risposto',
  capReachedTitle: 'Nessuna domanda rimasta questo mese',
  capReachedDescription: 'La tua organizzazione stabilisce quante domande può fare ogni studente.',
  poolExhaustedTitle: 'L’assistente non è disponibile',
  poolExhaustedDescription: 'La tua organizzazione ha esaurito la quota di IA di questo mese.',
  disabledTitle: 'L’assistente è disattivato',
  disabledDescription: 'La tua organizzazione non ha attivato il tutor IA.',
  notConfiguredTitle: 'L’assistente non è disponibile',
  notConfiguredDescription: 'Su questo server non è configurato alcun fornitore di IA.',
  noCoursesTitle: 'Iscriviti prima a un corso',
  noCoursesDescription: 'L’assistente risponde a domande sui corsi a cui sei iscritto.'
};
