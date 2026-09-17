import type { PathDifficulty } from '../utils/types';

export type LearningPathView = 'grid' | 'list';
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
  coverImage?: string;
  difficulty: PathDifficulty;
  status: CourseStatus;
  progressPercent: number;
  partOfPath: CourseLibraryPathRef | null;
  href: string;
  lessonCount?: number;
  exerciseCount?: number;
  courseType?: string;
}

export type CourseInPathState = 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED';

export interface CourseInPathNode {
  title: string;
  state: CourseInPathState;
}

export interface CourseInPathNextInfo {
  position: number;
  title: string;
  remainingLessons: number;
  remainingExercises: number;
}

export interface CourseInPathContext {
  pathName: string;
  pathHref: string;
  nodes: CourseInPathNode[];
  currentPosition: number;
  next: CourseInPathNextInfo | null;
  isPathComplete: boolean;
}
