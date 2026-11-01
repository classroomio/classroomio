import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const hi: TranslatedMessages<typeof en> = {
  offline: 'ऑफ़लाइन',
  youAreOffline: 'आप ऑफ़लाइन हैं',
  syncsOnReconnect: 'दोबारा कनेक्ट होने पर प्रगति सिंक हो जाएगी',
  changesWaiting: {
    one: '{count} बदलाव सिंक होने की प्रतीक्षा में है',
    other: '{count} बदलाव सिंक होने की प्रतीक्षा में हैं'
  },
  changesWaitingSentence: {
    one: '{count} बदलाव सिंक होने की प्रतीक्षा में है।',
    other: '{count} बदलाव सिंक होने की प्रतीक्षा में हैं।'
  },
  changesWillSync: {
    one: 'दोबारा कनेक्ट होने पर {count} बदलाव सिंक होगा।',
    other: 'दोबारा कनेक्ट होने पर {count} बदलाव सिंक होंगे।'
  },
  allSynced: 'इस डिवाइस पर दर्ज सब कुछ सिंक हो गया है।',
  synced: 'सिंक हो गया',
  syncing: 'सिंक हो रहा है',
  waitingToSync: 'सिंक की प्रतीक्षा में',
  retryingAttempt: 'अपने आप दोबारा कोशिश हो रही है · प्रयास {attempt}',
  notAccepted: 'स्वीकार नहीं हुआ',
  notAcceptedReason: 'स्वीकार नहीं हुआ: {reason}',
  lessonCompleted: 'पाठ पूरा हुआ',
  videoProgressAt: '{position} पर वीडियो प्रगति',
  videoProgress: 'वीडियो प्रगति',
  updateCount: { one: '{count} अपडेट', other: '{count} अपडेट' },
  retry: 'फिर कोशिश करें',
  syncTitle: 'सिंक',
  syncNow: 'अभी सिंक करें',
  signInToSave: 'अपनी प्रगति सहेजने के लिए फिर से साइन इन करें।'
};
