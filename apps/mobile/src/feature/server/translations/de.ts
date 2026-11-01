import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const de: TranslatedMessages<typeof en> = {
  title: 'Server',
  description:
    'Selbst gehostete Organisationen betreiben eine eigene ClassroomIO-API. Verwenden Sie die Adresse, die Sie von Ihrer Administration erhalten haben.',
  addressLabel: 'API-Adresse',
  addressPlaceholder: 'api.ihrefirma.de',
  currently: 'Aktuell {host}',
  connect: 'Verbinden',
  useCloud: 'ClassroomIO Cloud verwenden',
  updated: 'Server aktualisiert',
  unusable: 'Dieser Server kann nicht verwendet werden.',
  unreachable: 'Der Server ist nicht erreichbar. Prüfen Sie die Adresse und Ihre Verbindung.',
  notClassroomio: 'Diese Adresse hat nicht wie ein ClassroomIO-Server geantwortet.'
};
