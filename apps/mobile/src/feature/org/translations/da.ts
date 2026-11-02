import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const da: TranslatedMessages<typeof en> = {
  roleAdmin: 'Administrator',
  roleTutor: 'Underviser',
  roleStudent: 'Studerende',
  roleMember: 'Medlem',
  loadError: 'Dine organisationer blev ikke indlæst',
  noOrgTitle: 'Ingen organisation endnu',
  noOrgDescription:
    'Denne konto er ikke medlem af nogen organisation. Bed din uddannelsesadministrator om at invitere dig, og log derefter ind igen.',
  chooseTitle: 'Vælg en organisation',
  chooseDescription: 'Du kan skifte organisation senere fra din profil.'
};
