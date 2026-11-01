import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pt: TranslatedMessages<typeof en> = {
  signInTitle: 'Entrar',
  signInSubtitle: 'Use a conta com que sua organização convidou você.',
  or: 'ou',
  changeServer: 'Alterar',
  emailLabel: 'E-mail',
  emailPlaceholder: 'voce@empresa.com',
  passwordLabel: 'Senha',
  forgotPassword: 'Esqueceu a senha?',
  passwordPlaceholder: 'Sua senha',
  signInFailed: 'Não foi possível entrar. Verifique seu e-mail e sua senha.',
  continueWithProvider: 'Continuar com {provider}',
  googleSignInFailedTitle: 'O login com o Google não foi concluído',
  googleSignInFailedDescription: 'Tente novamente ou entre com seu e-mail e sua senha.',
  signInWithSso: 'Entrar com SSO',
  tooManyAttempts: 'Muitas tentativas. Aguarde um minuto e tente novamente.',
  ssoRequiredTitle: 'Sua organização exige login único',
  ssoRequiredDescription: 'Contas de {domain} entram pelo {provider}, não com senha.',
  yourIdentityProvider: 'seu provedor de identidade',
  ssoSubtitle: 'Use seu e-mail de trabalho. Se sua organização tiver login único, você entra com sua conta da empresa.',
  workEmailLabel: 'E-mail de trabalho',
  workEmailInvalid: 'Digite seu endereço de e-mail de trabalho completo.',
  ssoNotSetUp:
    'O login único não está configurado para {domain}. Entre com sua senha ou pergunte ao administrador como sua organização faz login.',
  ssoBrowserNote: 'O provedor de identidade da sua organização abre no navegador.',
  ssoDidNotFinish: 'O login com {provider} não foi concluído. Tente novamente.',
  singleSignOn: 'login único',
  ssoCouldNotStart: 'Não foi possível iniciar o login único. Tente novamente.',
  resetTitle: 'Redefinir sua senha',
  resetEmailInvalid: 'Digite o e-mail que você usa para entrar.',
  resetDescription: 'Enviamos por e-mail um link para você definir uma nova senha no navegador.',
  sendResetLink: 'Enviar link',
  checkEmailTitle: 'Verifique seu e-mail',
  checkEmailDescription:
    'Se {email} tiver uma conta ClassroomIO, um link de redefinição está a caminho. Abra-o, escolha uma nova senha e depois entre aqui com ela.',
  backToSignIn: 'Voltar para o login',
  useDifferentEmail: 'Usar outro e-mail',
  resetEmailFailed: 'Não foi possível enviar o e-mail de redefinição. Tente novamente.',
  invalidEmail: 'Digite um e-mail válido.',
  invalidCredentials: 'O e-mail ou a senha estão incorretos.',
  emailNotVerified: 'Confirme seu e-mail antes de entrar. O link está na sua caixa de entrada.'
};
