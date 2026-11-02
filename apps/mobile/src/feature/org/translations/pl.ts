import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  roleAdmin: 'Administrator',
  roleTutor: 'Prowadzący',
  roleStudent: 'Uczestnik',
  roleMember: 'Członek',
  loadError: 'Nie udało się wczytać Twoich organizacji',
  noOrgTitle: 'Brak organizacji',
  noOrgDescription:
    'To konto nie należy do żadnej organizacji. Poproś administratora szkoleń o zaproszenie, a potem zaloguj się ponownie.',
  chooseTitle: 'Wybierz organizację',
  chooseDescription: 'Organizację możesz później zmienić w profilu.'
};
