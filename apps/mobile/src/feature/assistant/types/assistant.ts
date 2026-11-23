import type { TutorUnavailableReason } from '@/feature/lesson/types/tutor';

export type AssistantUnavailableReason = TutorUnavailableReason | 'no_courses';
