import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const hi: TranslatedMessages<typeof en> = {
  streakDays: { one: '{count} दिन की स्ट्रीक', other: '{count} दिन की स्ट्रीक' },
  noStreak: 'अभी कोई स्ट्रीक नहीं',
  noStreakDescription: 'शुरू करने के लिए कोई पाठ पूरा करें, अभ्यास सबमिट करें या लाइव क्लास में शामिल हों।',
  activeToday: 'आपने आज पढ़ाई की है।',
  notActiveToday: 'अपनी स्ट्रीक बनाए रखने के लिए आज पढ़ाई करें।',
  bestStreak: { one: 'सर्वश्रेष्ठ: {count} दिन', other: 'सर्वश्रेष्ठ: {count} दिन' },
  weekendNote: 'सप्ताहांत से स्ट्रीक नहीं टूटती।',
  dayActive: '{day}, पढ़ाई की',
  dayInactive: '{day}, पढ़ाई नहीं की',
  weeklyTitle: 'साप्ताहिक पाठ लक्ष्य',
  weeklyProgress: 'इस सप्ताह {target} में से {completed} पाठ',
  weeklyReached: 'आपने इस सप्ताह अपना लक्ष्य पूरा कर लिया।',
  targetLabel: { one: 'हर सप्ताह {count} पाठ', other: 'हर सप्ताह {count} पाठ' },
  lowerTarget: 'साप्ताहिक लक्ष्य घटाएं',
  raiseTarget: 'साप्ताहिक लक्ष्य बढ़ाएं',
  goalNotSaved: 'आपका साप्ताहिक लक्ष्य सेव नहीं हुआ',
  milestonesTitle: 'उपलब्धियां',
  milestoneName: { one: '{count} दिन की स्ट्रीक', other: '{count} दिन की स्ट्रीक' },
  milestoneAchieved: 'हासिल किया',
  milestoneRemaining: { one: '{count} दिन बाकी', other: '{count} दिन बाकी' },
  streakUnit: { one: 'दिन की स्ट्रीक', other: 'दिन की स्ट्रीक' },
  weeklyRemaining: {
    one: 'लक्ष्य तक पहुँचने के लिए {count} और पाठ।',
    other: 'लक्ष्य तक पहुँचने के लिए {count} और पाठ।'
  },
  ofTarget: '{target} में से',
  nextMilestoneTitle: 'अगली उपलब्धि',
  milestoneProgress: { one: '{count} में से {current} दिन', other: '{count} में से {current} दिन' },
  allMilestonesEarned: 'आपने सभी उपलब्धियां हासिल कर ली हैं।',
  loadError: 'आपके लक्ष्य लोड नहीं हुए',
  welcomeTitle: { one: '{count} दिन की स्ट्रीक', other: '{count} दिन की स्ट्रीक' },
  welcomeDescription: 'इसे जारी रखने के लिए आज कुछ सीखें।',
  welcomeDescriptionActive: 'आप आज पढ़ाई कर चुके हैं।',
  welcomeResume: 'जहां छोड़ा था वहीं से शुरू करें',
  welcomeExplore: 'नए कोर्स खोजें',
  welcomeDismiss: 'बंद करें'
};
