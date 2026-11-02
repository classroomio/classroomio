import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const it: TranslatedMessages<typeof en> = {
  roleAdmin: 'Amministratore',
  roleTutor: 'Tutor',
  roleStudent: 'Studente',
  roleMember: 'Membro',
  loadError: 'Le tue organizzazioni non sono state caricate',
  noOrgTitle: 'Ancora nessuna organizzazione',
  noOrgDescription:
    "Questo account non fa parte di alcuna organizzazione. Chiedi all'amministratore della formazione di invitarti, poi accedi di nuovo.",
  chooseTitle: "Scegli un'organizzazione",
  chooseDescription: 'Puoi cambiare organizzazione in seguito dal tuo profilo.'
};
