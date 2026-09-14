import type { PathDifficulty } from '../utils/types';

export type LearningPathView = 'grid' | 'list';
export type DurationFilter = 'under-4' | '4-10' | '10-up';
export type CourseDurationFilter = 'under-1' | '1-4' | '4-up';
export type CourseStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface CourseLibraryPathRef {
  id: string;
  name: string;
  href: string;
}

export interface CourseLibraryItem {
  id: string;
  title: string;
  description: string;
  coverGradient?: string;
  durationHours: number;
  difficulty: PathDifficulty;
  status: CourseStatus;
  progressPercent: number;
  partOfPath: CourseLibraryPathRef | null;
  href: string;
}
