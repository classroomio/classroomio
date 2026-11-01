import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const de: TranslatedMessages<typeof en> = {
  roleAdmin: 'Admin',
  roleTutor: 'Tutor',
  roleStudent: 'Teilnehmer',
  roleMember: 'Mitglied',
  loadError: 'Ihre Organisationen wurden nicht geladen',
  noOrgTitle: 'Noch keine Organisation',
  noOrgDescription:
    'Dieses Konto gehört zu keiner Organisation. Bitten Sie Ihre Schulungsadministration um eine Einladung und melden Sie sich danach erneut an.',
  chooseTitle: 'Organisation auswählen',
  chooseDescription: 'Sie können die Organisation später in Ihrem Profil wechseln.'
};
