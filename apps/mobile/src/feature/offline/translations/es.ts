import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const es: TranslatedMessages<typeof en> = {
  offline: 'Sin conexión',
  youAreOffline: 'No tienes conexión',
  syncsOnReconnect: 'Tu progreso se sincroniza al volver a conectarte',
  changesWaiting: {
    one: '{count} cambio pendiente de sincronizar',
    other: '{count} cambios pendientes de sincronizar'
  },
  changesWaitingSentence: {
    one: '{count} cambio pendiente de sincronizar.',
    other: '{count} cambios pendientes de sincronizar.'
  },
  changesWillSync: {
    one: '{count} cambio se sincronizará al volver a conectarte.',
    other: '{count} cambios se sincronizarán al volver a conectarte.'
  },
  allSynced: 'Todo lo registrado en este dispositivo está sincronizado.',
  synced: 'Sincronizado',
  syncing: 'Sincronizando',
  waitingToSync: 'Pendiente de sincronizar',
  retryingAttempt: 'Reintentando automáticamente · intento {attempt}',
  notAccepted: 'No aceptado',
  notAcceptedReason: 'No aceptado: {reason}',
  lessonCompleted: 'Lección completada',
  videoProgressAt: 'Progreso del video en {position}',
  videoProgress: 'Progreso del video',
  updateCount: { one: '{count} actualización', other: '{count} actualizaciones' },
  retry: 'Reintentar',
  syncTitle: 'Sincronización',
  syncNow: 'Sincronizar ahora',
  signInToSave: 'Vuelve a iniciar sesión para guardar tu progreso.'
};
