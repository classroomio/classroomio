import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const fr: TranslatedMessages<typeof en> = {
  streakDays: { one: 'Série de {count} jour', other: 'Série de {count} jours' },
  noStreak: 'Pas encore de série',
  noStreakDescription: 'Terminez une leçon, rendez un exercice ou assistez à un cours en direct pour en commencer une.',
  activeToday: 'Vous avez appris aujourd’hui.',
  notActiveToday: 'Apprenez aujourd’hui pour garder votre série.',
  bestStreak: { one: 'Record : {count} jour', other: 'Record : {count} jours' },
  weekendNote: 'Les week-ends n’interrompent jamais une série.',
  dayActive: '{day}, actif',
  dayInactive: '{day}, inactif',
  weeklyTitle: 'Objectif hebdomadaire de leçons',
  weeklyProgress: '{completed} leçons sur {target} cette semaine',
  weeklyReached: 'Vous avez atteint votre objectif cette semaine.',
  targetLabel: { one: '{count} leçon par semaine', other: '{count} leçons par semaine' },
  lowerTarget: 'Réduire l’objectif hebdomadaire',
  raiseTarget: 'Augmenter l’objectif hebdomadaire',
  goalNotSaved: 'Votre objectif hebdomadaire n’a pas été enregistré',
  milestonesTitle: 'Étapes',
  milestoneName: { one: 'Série de {count} jour', other: 'Série de {count} jours' },
  milestoneAchieved: 'Atteint',
  milestoneRemaining: { one: 'Encore {count} jour', other: 'Encore {count} jours' },
  streakUnit: { one: 'jour d’affilée', other: 'jours d’affilée' },
  weeklyRemaining: { one: 'Encore {count} leçon pour l’atteindre.', other: 'Encore {count} leçons pour l’atteindre.' },
  ofTarget: 'sur {target}',
  nextMilestoneTitle: 'Prochaine étape',
  milestoneProgress: { one: '{current} jour sur {count}', other: '{current} jours sur {count}' },
  allMilestonesEarned: 'Vous avez franchi toutes les étapes.',
  loadError: 'Vos objectifs ne se sont pas chargés',
  welcomeTitle: { one: 'Série de {count} jour', other: 'Série de {count} jours' },
  welcomeDescription: 'Apprenez quelque chose aujourd’hui pour la prolonger.',
  welcomeDescriptionActive: 'Vous avez déjà appris aujourd’hui.',
  welcomeResume: 'Reprendre là où vous vous êtes arrêté',
  welcomeExplore: 'Découvrir de nouveaux cours',
  welcomeDismiss: 'Fermer'
};
