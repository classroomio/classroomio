import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pt: TranslatedMessages<typeof en> = {
  title: 'Perguntar à IA',
  description: 'Sobre seus cursos e metas',
  emptyTitle: 'Pergunte sobre sua aprendizagem',
  emptyDescription: 'Pergunte sobre seus cursos, o que vence a seguir ou como atingir sua meta semanal.',
  placeholder: 'Faça uma pergunta',
  inputLabel: 'Pergunta para o assistente',
  send: 'Enviar',
  stop: 'Parar resposta',
  stopped: 'A resposta parou. Pergunte novamente.',
  requestFailed: 'O assistente não respondeu',
  capReachedTitle: 'Sem perguntas restantes neste mês',
  capReachedDescription: 'Sua organização define quantas perguntas cada aluno pode fazer.',
  poolExhaustedTitle: 'O assistente não está disponível',
  poolExhaustedDescription: 'Sua organização usou a cota de IA deste mês.',
  disabledTitle: 'O assistente está desativado',
  disabledDescription: 'Sua organização não ativou o tutor de IA.',
  notConfiguredTitle: 'O assistente não está disponível',
  notConfiguredDescription: 'Este servidor não tem um provedor de IA configurado.',
  noCoursesTitle: 'Entre em um curso primeiro',
  noCoursesDescription: 'O assistente responde perguntas sobre os cursos em que você está inscrito.'
};
