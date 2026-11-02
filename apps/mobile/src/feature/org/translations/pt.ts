import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pt: TranslatedMessages<typeof en> = {
  roleAdmin: 'Administrador',
  roleTutor: 'Tutor',
  roleStudent: 'Aluno',
  roleMember: 'Membro',
  loadError: 'Suas organizações não carregaram',
  noOrgTitle: 'Nenhuma organização ainda',
  noOrgDescription:
    'Esta conta não faz parte de nenhuma organização. Peça ao administrador de treinamentos para convidar você e entre novamente.',
  chooseTitle: 'Escolha uma organização',
  chooseDescription: 'Você pode trocar de organização depois pelo seu perfil.'
};
