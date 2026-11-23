import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const da: TranslatedMessages<typeof en> = {
  title: 'Spørg AI',
  description: 'Om dine kurser og mål',
  emptyTitle: 'Spørg om din læring',
  emptyDescription: 'Spørg om dine kurser, hvad der skal afleveres, eller hvordan du når dit ugentlige mål.',
  placeholder: 'Stil et spørgsmål',
  inputLabel: 'Spørgsmål til assistenten',
  send: 'Send',
  stop: 'Stop svaret',
  stopped: 'Svaret stoppede. Spørg igen for at fortsætte.',
  requestFailed: 'Assistenten svarede ikke',
  capReachedTitle: 'Ingen spørgsmål tilbage denne måned',
  capReachedDescription: 'Din organisation bestemmer, hvor mange spørgsmål hver elev kan stille.',
  poolExhaustedTitle: 'Assistenten er ikke tilgængelig',
  poolExhaustedDescription: 'Din organisation har brugt sin AI-kvote for denne måned.',
  disabledTitle: 'Assistenten er slået fra',
  disabledDescription: 'Din organisation har ikke slået AI-tutoren til.',
  notConfiguredTitle: 'Assistenten er ikke tilgængelig',
  notConfiguredDescription: 'Denne server har ingen AI-udbyder.',
  noCoursesTitle: 'Tilmeld dig et kursus først',
  noCoursesDescription: 'Assistenten besvarer spørgsmål om de kurser, du er tilmeldt.'
};
