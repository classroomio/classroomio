import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pt: TranslatedMessages<typeof en> = {
  screenTitle: 'Explorar',
  entryTitle: 'Explorar cursos',
  entryDescription: 'Cursos em que você pode se inscrever',
  searchCourses: 'Buscar cursos',
  emptyTitle: 'Nenhum outro curso',
  emptyDescription: 'Sua organização não tem outros cursos disponíveis para você.',
  searchNoResultsTitle: 'Nenhum curso correspondente',
  searchNoResultsDescription: 'Nenhum título de curso contém “{query}”.',
  loadError: 'Os cursos não foram carregados',
  courseLoadError: 'Este curso não foi carregado',
  about: 'Sobre este curso',
  goals: 'O que você vai aprender',
  requirements: 'Requisitos',
  enroll: 'Inscrever-se',
  goToCourse: 'Ir para o curso',
  enrolledToast: 'Você está inscrito em {title}',
  enrollFailed: 'A inscrição não foi concluída',
  enrollFull: 'Este curso não está aceitando novos alunos no momento. Fale com sua organização.',
  enrollMembersOnly: 'Somente membros desta organização podem se inscrever. Peça um convite a um administrador.',
  enrollUnavailable: 'Não é possível se inscrever neste curso pelo app.',
  paidNotAvailable: 'Este curso não está disponível para inscrição no app.',
  inviteOnly: 'Sua organização inscreve os alunos neste curso.',
  originalPrice: 'Preço original {price}'
};
