import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const fr: TranslatedMessages<typeof en> = {
  title: 'Serveur',
  description:
    "Les organisations auto-hébergées exécutent leur propre API ClassroomIO. Utilisez l'adresse fournie par votre administrateur.",
  addressLabel: "Adresse de l'API",
  addressPlaceholder: 'api.votreentreprise.fr',
  currently: 'Actuellement {host}',
  connect: 'Se connecter',
  useCloud: 'Utiliser le cloud ClassroomIO',
  updated: 'Serveur mis à jour',
  unusable: 'Ce serveur ne peut pas être utilisé.',
  unreachable: "Impossible de joindre ce serveur. Vérifiez l'adresse et votre connexion.",
  notClassroomio: "Cette adresse n'a pas répondu comme un serveur ClassroomIO."
};
