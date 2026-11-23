import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const fr: TranslatedMessages<typeof en> = {
  title: 'Demander à l’IA',
  description: 'Sur vos cours et vos objectifs',
  emptyTitle: 'Posez une question sur votre apprentissage',
  emptyDescription: 'Posez une question sur vos cours, les prochaines échéances ou votre objectif hebdomadaire.',
  placeholder: 'Posez une question',
  inputLabel: 'Question pour l’assistant',
  send: 'Envoyer',
  stop: 'Arrêter la réponse',
  stopped: 'La réponse s’est arrêtée. Reposez la question.',
  requestFailed: 'L’assistant n’a pas répondu',
  capReachedTitle: 'Plus de questions ce mois-ci',
  capReachedDescription: 'Votre organisation fixe le nombre de questions par apprenant.',
  poolExhaustedTitle: 'L’assistant n’est pas disponible',
  poolExhaustedDescription: 'Votre organisation a épuisé son quota d’IA pour ce mois.',
  disabledTitle: 'L’assistant est désactivé',
  disabledDescription: 'Votre organisation n’a pas activé le tuteur IA.',
  notConfiguredTitle: 'L’assistant n’est pas disponible',
  notConfiguredDescription: 'Aucun fournisseur d’IA n’est configuré sur ce serveur.',
  noCoursesTitle: 'Inscrivez-vous d’abord à un cours',
  noCoursesDescription: 'L’assistant répond aux questions sur les cours auxquels vous êtes inscrit.'
};
