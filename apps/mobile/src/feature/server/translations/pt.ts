import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pt: TranslatedMessages<typeof en> = {
  title: 'Servidor',
  description:
    'Organizações auto-hospedadas executam a própria API do ClassroomIO. Use o endereço informado pelo administrador.',
  addressLabel: 'Endereço da API',
  addressPlaceholder: 'api.suaempresa.com.br',
  currently: 'Atualmente {host}',
  connect: 'Conectar',
  useCloud: 'Usar a nuvem do ClassroomIO',
  updated: 'Servidor atualizado',
  unusable: 'Não foi possível usar esse servidor.',
  unreachable: 'Não foi possível acessar esse servidor. Verifique o endereço e sua conexão.',
  notClassroomio: 'Esse endereço não respondeu como um servidor ClassroomIO.'
};
