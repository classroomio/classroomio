import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const es: TranslatedMessages<typeof en> = {
  signInTitle: 'Iniciar sesión',
  signInSubtitle: 'Usa la cuenta con la que te invitó tu organización.',
  or: 'o',
  changeServer: 'Cambiar',
  emailLabel: 'Correo electrónico',
  emailPlaceholder: 'tu@empresa.com',
  passwordLabel: 'Contraseña',
  forgotPassword: '¿Olvidaste tu contraseña?',
  passwordPlaceholder: 'Tu contraseña',
  signInFailed: 'No pudimos iniciar tu sesión. Revisa tu correo electrónico y tu contraseña.',
  continueWithProvider: 'Continuar con {provider}',
  googleSignInFailedTitle: 'No se completó el inicio de sesión con Google',
  googleSignInFailedDescription: 'Inténtalo de nuevo o inicia sesión con tu correo electrónico y contraseña.',
  signInWithSso: 'Iniciar sesión con SSO',
  tooManyAttempts: 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.',
  ssoRequiredTitle: 'Tu organización exige el inicio de sesión único',
  ssoRequiredDescription: 'Las cuentas de {domain} inician sesión con {provider}, no con contraseña.',
  yourIdentityProvider: 'tu proveedor de identidad',
  ssoSubtitle:
    'Usa tu correo del trabajo. Si tu organización tiene inicio de sesión único, entras con tu cuenta de empresa.',
  workEmailLabel: 'Correo del trabajo',
  workEmailInvalid: 'Escribe tu dirección de correo del trabajo completa.',
  ssoNotSetUp:
    'El inicio de sesión único no está configurado para {domain}. Inicia sesión con tu contraseña o pregunta a tu administrador cómo accede tu organización.',
  ssoBrowserNote: 'El proveedor de identidad de tu organización se abre en el navegador.',
  ssoDidNotFinish: 'No se completó el inicio de sesión con {provider}. Inténtalo de nuevo.',
  singleSignOn: 'inicio de sesión único',
  ssoCouldNotStart: 'No se pudo iniciar el inicio de sesión único. Inténtalo de nuevo.',
  resetTitle: 'Restablece tu contraseña',
  resetEmailInvalid: 'Escribe el correo electrónico con el que inicias sesión.',
  resetDescription: 'Te enviamos un enlace por correo para crear una contraseña nueva en el navegador.',
  sendResetLink: 'Enviar enlace',
  checkEmailTitle: 'Revisa tu correo',
  checkEmailDescription:
    'Si {email} tiene una cuenta de ClassroomIO, te llegará un enlace para restablecerla. Ábrelo, elige una contraseña nueva e inicia sesión aquí con ella.',
  backToSignIn: 'Volver a iniciar sesión',
  useDifferentEmail: 'Usar otro correo',
  resetEmailFailed: 'No pudimos enviar el correo para restablecer la contraseña. Inténtalo de nuevo.',
  invalidEmail: 'Introduce un correo electrónico válido.',
  invalidCredentials: 'El correo electrónico o la contraseña no son correctos.',
  emailNotVerified: 'Verifica tu correo electrónico antes de iniciar sesión. El enlace está en tu bandeja de entrada.'
};
