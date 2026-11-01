import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const fr: TranslatedMessages<typeof en> = {
  roleAdmin: 'Administrateur',
  roleTutor: 'Tuteur',
  roleStudent: 'Étudiant',
  roleMember: 'Membre',
  loadError: "Vos organisations n'ont pas pu être chargées",
  noOrgTitle: "Aucune organisation pour l'instant",
  noOrgDescription:
    "Ce compte n'est membre d'aucune organisation. Demandez à votre administrateur de formation de vous inviter, puis reconnectez-vous.",
  chooseTitle: 'Choisir une organisation',
  chooseDescription: "Vous pourrez changer d'organisation plus tard depuis votre profil."
};
