import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const es: TranslatedMessages<typeof en> = {
  title: 'Preguntar a la IA',
  description: 'Sobre tus cursos y metas',
  emptyTitle: 'Pregunta sobre tu aprendizaje',
  emptyDescription: 'Pregunta sobre tus cursos, lo próximo que vence o cómo alcanzar tu meta semanal.',
  placeholder: 'Haz una pregunta',
  inputLabel: 'Pregunta para el asistente',
  send: 'Enviar',
  stop: 'Detener respuesta',
  stopped: 'La respuesta se detuvo. Vuelve a preguntar.',
  requestFailed: 'El asistente no respondió',
  capReachedTitle: 'No te quedan preguntas este mes',
  capReachedDescription: 'Tu organización decide cuántas preguntas puede hacer cada estudiante.',
  poolExhaustedTitle: 'El asistente no está disponible',
  poolExhaustedDescription: 'Tu organización ha agotado su cupo de IA de este mes.',
  disabledTitle: 'El asistente está desactivado',
  disabledDescription: 'Tu organización no ha activado el tutor de IA.',
  notConfiguredTitle: 'El asistente no está disponible',
  notConfiguredDescription: 'Este servidor no tiene un proveedor de IA configurado.',
  noCoursesTitle: 'Únete primero a un curso',
  noCoursesDescription: 'El asistente responde preguntas sobre los cursos en los que estás inscrito.'
};
