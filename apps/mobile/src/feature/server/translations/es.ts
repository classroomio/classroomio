import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const es: TranslatedMessages<typeof en> = {
  title: 'Servidor',
  description:
    'Las organizaciones autoalojadas ejecutan su propia API de ClassroomIO. Usa la dirección que te dio tu administrador.',
  addressLabel: 'Dirección de la API',
  addressPlaceholder: 'api.tuempresa.com',
  currently: 'Actualmente {host}',
  connect: 'Conectar',
  useCloud: 'Usar ClassroomIO en la nube',
  updated: 'Servidor actualizado',
  unusable: 'No se pudo usar ese servidor.',
  unreachable: 'No pudimos conectar con ese servidor. Revisa la dirección y tu conexión.',
  notClassroomio: 'Esa dirección no respondió como un servidor de ClassroomIO.'
};
