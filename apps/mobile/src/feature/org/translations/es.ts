import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const es: TranslatedMessages<typeof en> = {
  roleAdmin: 'Administrador',
  roleTutor: 'Tutor',
  roleStudent: 'Estudiante',
  roleMember: 'Miembro',
  loadError: 'No se cargaron tus organizaciones',
  noOrgTitle: 'Aún no tienes organización',
  noOrgDescription:
    'Esta cuenta no pertenece a ninguna organización. Pide a tu administrador de formación que te invite y vuelve a iniciar sesión.',
  chooseTitle: 'Elige una organización',
  chooseDescription: 'Puedes cambiar de organización más tarde desde tu perfil.'
};
