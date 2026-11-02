import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const fr: TranslatedMessages<typeof en> = {
  signInTitle: 'Se connecter',
  signInSubtitle: 'Utilisez le compte avec lequel votre organisation vous a invité.',
  or: 'ou',
  changeServer: 'Modifier',
  emailLabel: 'E-mail',
  emailPlaceholder: 'vous@entreprise.fr',
  passwordLabel: 'Mot de passe',
  forgotPassword: 'Mot de passe oublié ?',
  passwordPlaceholder: 'Votre mot de passe',
  signInFailed: 'Connexion impossible. Vérifiez votre e-mail et votre mot de passe.',
  continueWithProvider: 'Continuer avec {provider}',
  googleSignInFailedTitle: "La connexion avec Google n'a pas abouti",
  googleSignInFailedDescription: 'Réessayez ou connectez-vous avec votre e-mail et votre mot de passe.',
  signInWithSso: 'Se connecter avec le SSO',
  tooManyAttempts: 'Trop de tentatives. Patientez une minute, puis réessayez.',
  ssoRequiredTitle: "Votre organisation exige l'authentification unique",
  ssoRequiredDescription: 'Les comptes {domain} se connectent via {provider}, pas avec un mot de passe.',
  yourIdentityProvider: "votre fournisseur d'identité",
  ssoSubtitle:
    "Utilisez votre e-mail professionnel. Si votre organisation utilise l'authentification unique, vous vous connectez avec votre compte d'entreprise.",
  workEmailLabel: 'E-mail professionnel',
  workEmailInvalid: 'Saisissez votre adresse e-mail professionnelle complète.',
  ssoNotSetUp:
    "L'authentification unique n'est pas configurée pour {domain}. Connectez-vous avec votre mot de passe ou demandez à votre administrateur comment votre organisation se connecte.",
  ssoBrowserNote: "Le fournisseur d'identité de votre organisation s'ouvre dans le navigateur.",
  ssoDidNotFinish: "La connexion avec {provider} n'a pas abouti. Réessayez.",
  singleSignOn: 'authentification unique',
  ssoCouldNotStart: "Impossible de lancer l'authentification unique. Réessayez.",
  resetTitle: 'Réinitialiser votre mot de passe',
  resetEmailInvalid: "Saisissez l'adresse e-mail que vous utilisez pour vous connecter.",
  resetDescription: 'Nous vous envoyons par e-mail un lien pour définir un nouveau mot de passe dans votre navigateur.',
  sendResetLink: 'Envoyer le lien',
  checkEmailTitle: 'Consultez vos e-mails',
  checkEmailDescription:
    'Si {email} possède un compte ClassroomIO, un lien de réinitialisation est en route. Ouvrez-le, choisissez un nouveau mot de passe, puis connectez-vous ici avec celui-ci.',
  backToSignIn: 'Retour à la connexion',
  useDifferentEmail: 'Utiliser une autre adresse e-mail',
  resetEmailFailed: "Impossible d'envoyer l'e-mail de réinitialisation. Réessayez.",
  invalidEmail: 'Saisissez une adresse e-mail valide.',
  invalidCredentials: 'L’e-mail ou le mot de passe est incorrect.',
  emailNotVerified:
    'Confirmez votre adresse e-mail avant de vous connecter. Le lien se trouve dans votre boîte de réception.'
};
