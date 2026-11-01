import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const it: TranslatedMessages<typeof en> = {
  title: 'Server',
  description:
    "Le organizzazioni self-hosted usano una propria API ClassroomIO. Usa l'indirizzo fornito dall'amministratore.",
  addressLabel: 'Indirizzo API',
  addressPlaceholder: 'api.tuaazienda.it',
  currently: 'Attualmente {host}',
  connect: 'Connetti',
  useCloud: 'Usa il cloud ClassroomIO',
  updated: 'Server aggiornato',
  unusable: 'Impossibile usare quel server.',
  unreachable: "Impossibile raggiungere il server. Controlla l'indirizzo e la connessione.",
  notClassroomio: "Quell'indirizzo non ha risposto come un server ClassroomIO."
};
