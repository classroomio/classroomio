import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pt: TranslatedMessages<typeof en> = {
  offline: 'Offline',
  youAreOffline: 'Você está offline',
  syncsOnReconnect: 'O progresso é sincronizado quando você se reconectar',
  changesWaiting: {
    one: '{count} alteração aguardando sincronização',
    other: '{count} alterações aguardando sincronização'
  },
  changesWaitingSentence: {
    one: '{count} alteração aguardando sincronização.',
    other: '{count} alterações aguardando sincronização.'
  },
  changesWillSync: {
    one: '{count} alteração será sincronizada quando você se reconectar.',
    other: '{count} alterações serão sincronizadas quando você se reconectar.'
  },
  allSynced: 'Tudo o que foi registrado neste dispositivo está sincronizado.',
  synced: 'Sincronizado',
  syncing: 'Sincronizando',
  waitingToSync: 'Aguardando sincronização',
  retryingAttempt: 'Tentando novamente · tentativa {attempt}',
  notAccepted: 'Não aceito',
  notAcceptedReason: 'Não aceito: {reason}',
  lessonCompleted: 'Aula concluída',
  videoProgressAt: 'Progresso do vídeo em {position}',
  videoProgress: 'Progresso do vídeo',
  updateCount: { one: '{count} atualização', other: '{count} atualizações' },
  retry: 'Tentar novamente',
  syncTitle: 'Sincronização',
  syncNow: 'Sincronizar agora',
  signInToSave: 'Entre novamente para salvar seu progresso.'
};
