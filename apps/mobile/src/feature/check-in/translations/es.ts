import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const es: TranslatedMessages<typeof en> = {
  screenTitle: 'Registrar entrada',
  checkIn: 'Registrar entrada',
  checkingIn: 'Registrando tu entrada',
  checkedInTitle: 'Entrada registrada',
  checkedInLateTitle: 'Entrada registrada con retraso',
  checkedInAt: 'Entrada a las {time}',
  openLesson: 'Abrir lección',
  scanAgain: 'Escanear de nuevo',
  scanTitle: 'Escanea el código de entrada',
  scanDescription: 'Apunta la cámara al código QR que muestra tu tutor.',
  viewfinderA11y: 'Vista de cámara para escanear el código QR de entrada',
  typeCodeTitle: 'O escribe el código',
  codeLabel: 'Código de entrada',
  codeDescription: '6 letras y números, debajo del código QR.',
  typeCodeFromLesson: 'Para escribir un código, abre la lección de la sesión y elige Registrar entrada.',
  cameraTitle: 'Permite el acceso a la cámara',
  cameraExplanation: 'La cámara lee el código QR de entrada. No se toman fotos ni se graba nada.',
  cameraBlocked: 'El acceso a la cámara está desactivado para ClassroomIO. Actívalo en Ajustes o escribe el código.',
  allowCamera: 'Permitir cámara',
  openSettings: 'Abrir Ajustes',
  notCheckInCode: 'Este código QR no es un código de entrada de ClassroomIO.',
  errorInvalidTitle: 'Ese código no funcionó',
  errorInvalid: 'Comprueba el código con tu tutor. Un código deja de funcionar cuando el tutor crea uno nuevo.',
  errorExpiredTitle: 'Este código ha caducado',
  errorExpired: 'Pide a tu tutor que muestre un código nuevo.',
  errorNotEnrolledTitle: 'No eres participante de este curso',
  errorNotEnrolled: 'Solo los participantes inscritos en el curso pueden registrar su entrada.',
  errorNotFoundTitle: 'Sesión no encontrada',
  errorNotFound:
    'La sesión no pertenece a tu organización actual. Cambia de organización en Perfil y vuelve a escanear.',
  errorRateLimitedTitle: 'Demasiados intentos',
  errorRateLimited: 'Espera unos minutos y vuelve a intentarlo.',
  errorGenericTitle: 'No se pudo registrar la entrada',
  errorLinkTitle: 'Este enlace no es un código de entrada',
  errorLink: 'Escanea el código QR que muestra tu tutor o escribe el código desde la lección.'
};
