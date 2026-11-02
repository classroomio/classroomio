import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const da: TranslatedMessages<typeof en> = {
  title: 'Server',
  description:
    'Selvhostede organisationer kører deres egen ClassroomIO API. Brug den adresse, din administrator har givet dig.',
  addressLabel: 'API-adresse',
  addressPlaceholder: 'api.dinvirksomhed.dk',
  currently: 'Lige nu {host}',
  connect: 'Opret forbindelse',
  useCloud: 'Brug ClassroomIO-cloud',
  updated: 'Serveren er opdateret',
  unusable: 'Den server kunne ikke bruges.',
  unreachable: 'Vi kunne ikke få forbindelse til serveren. Tjek adressen og din forbindelse.',
  notClassroomio: 'Adressen svarede ikke som en ClassroomIO-server.'
};
