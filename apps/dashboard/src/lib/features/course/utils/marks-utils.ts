import type { CourseContentItem, CourseMembers } from '$features/course/utils/types';
import type { Marks } from './types';
import { ContentType } from '@cio/utils/constants/content';
import Papa from 'papaparse';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

/** Exercise information for display in marks table (linear, no lesson grouping) */
export interface ExerciseInfo {
  id: string;
  title: string;
  points: number;
}

/** Maps groupMemberId -> exerciseId -> points obtained (as string) */
export type StudentMarksByExercise = {
  [groupMemberId: string]: {
    [exerciseId: string]: string;
  };
};

/** Student's exercise data for calculating totals */
export type StudentExerciseData =
  | {
      [exerciseId: string]: string;
    }
  | undefined;

/** Processed marks data structure returned from server */
export interface MarksPageData {
  studentMarksByExerciseId: StudentMarksByExercise;
  exercises: ExerciseInfo[];
  students: CourseMembers;
}

/**
 * Calculate total points for a student from their exercise data
 * @param studentExerciseData Student's marks by exercise ID
 * @returns Total points as number
 */
export function calculateStudentTotal(studentExerciseData: StudentExerciseData): number {
  if (!studentExerciseData) return 0;

  return Object.values(studentExerciseData).reduce((total: number, point) => {
    return (total += parseInt(point as string, 10));
  }, 0);
}

/**
 * Calculate average grade as percentage (points earned / total points possible) for a student
 * @param studentExerciseData Student's marks by exercise ID
 * @param exercises Ordered list of exercises with points
 * @returns Rounded percentage 0-100, or null if no exercises with points
 */
export function calculateStudentAverage(
  studentExerciseData: StudentExerciseData,
  exercises: ExerciseInfo[]
): number | null {
  if (!studentExerciseData || exercises.length === 0) return null;
  const totalPossible = exercises.reduce((sum, ex) => sum + ex.points, 0);
  if (totalPossible === 0) return null;
  const totalEarned = exercises.reduce((sum, ex) => {
    const pts = studentExerciseData[ex.id];
    return sum + (pts != null ? parseInt(pts, 10) : 0);
  }, 0);
  return Math.round((totalEarned / totalPossible) * 100);
}

/**
 * Transform marks array into nested object structure mapping groupMemberId -> exerciseId -> points
 * @param marks Array of mark records from API
 * @returns Nested object structure for student marks
 */
export function processMarksIntoStudentMarksByExerciseId(marks: Marks): StudentMarksByExercise {
  const result: StudentMarksByExercise = {};

  if (!Array.isArray(marks)) return result;

  marks.forEach((mark) => {
    const { groupmemberId, exerciseId, totalPointsGotten } = mark;

    if (!groupmemberId || !exerciseId) return;

    if (result[groupmemberId]) {
      result[groupmemberId] = {
        ...result[groupmemberId],
        [exerciseId]: totalPointsGotten?.toString() || '0'
      };
    } else {
      result[groupmemberId] = {
        [exerciseId]: totalPointsGotten?.toString() || '0'
      };
    }
  });

  return result;
}

/**
 * Build ordered list of exercises for gradebook from course content and marks.
 * When contentItems has no exercises (e.g. course fetch failed), derives order from marks.
 * @param marks Array of mark records from API
 * @param contentItems Flat or section-flattened content items (lesson + exercise) in display order; may be empty
 * @returns Ordered ExerciseInfo[] (exercise id, title, points)
 */
export function processMarksIntoExercises(marks: Marks, contentItems: CourseContentItem[]): ExerciseInfo[] {
  const marksByExerciseId = new Map<string, { title: string; points: number }>();
  const exerciseOrder: string[] = [];
  if (Array.isArray(marks)) {
    marks.forEach((mark) => {
      const { exerciseId, exerciseTitle, exercisePoints } = mark;
      if (!exerciseId) return;
      if (!marksByExerciseId.has(exerciseId)) {
        exerciseOrder.push(exerciseId);
        marksByExerciseId.set(exerciseId, {
          title: exerciseTitle || '',
          points: exercisePoints ?? 0
        });
      }
    });
  }

  const exerciseItems = contentItems.filter((item) => item.type === ContentType.Exercise);
  if (exerciseItems.length > 0) {
    return exerciseItems.map((item) => {
      const fromMarks = marksByExerciseId.get(item.id);
      return {
        id: item.id,
        title: item.title ?? fromMarks?.title ?? '',
        points: fromMarks?.points ?? 0
      };
    });
  }

  // No course content (e.g. course fetch failed): use exercises from marks, order by first appearance
  return exerciseOrder.map((id) => {
    const fromMarks = marksByExerciseId.get(id)!;
    return {
      id,
      title: fromMarks?.title ?? '',
      points: fromMarks?.points ?? 0
    };
  });
}

/**
 * Generate and download CSV export of marks (student by exercise + avg grade)
 * @param students Array of students
 * @param exercises Ordered exercises
 * @param studentMarksByExerciseId Student marks by exercise
 * @param courseTitle Course title for filename
 */
export function generateMarksCSV(
  students: CourseMembers,
  exercises: ExerciseInfo[],
  studentMarksByExerciseId: StudentMarksByExercise,
  courseTitle: string
): void {
  const exportData = students.map((student) => {
    const marks = studentMarksByExerciseId[student.id] || {};
    const rowData: Record<string, string | number> = {
      name: student.profile?.fullname || '',
      email: student.profile?.email || ''
    };
    exercises.forEach((ex) => {
      rowData[ex.title] = marks[ex.id] ?? '-';
    });
    const avg = calculateStudentAverage(marks, exercises);
    rowData['Avg grade'] = avg != null ? avg : '-';
    return rowData;
  });

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${courseTitle}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate and download PDF export of marks (student by exercise + avg grade)
 * @param students Array of students
 * @param exercises Ordered exercises
 * @param studentMarksByExerciseId Student marks by exercise
 * @param courseTitle Course title for filename and header
 */
export function generateMarksPDF(
  students: CourseMembers,
  exercises: ExerciseInfo[],
  studentMarksByExerciseId: StudentMarksByExercise,
  courseTitle: string
): void {
  try {
    const doc = new jsPDF({ orientation: 'landscape' });
    const head = [['Student', ...exercises.map((ex) => ex.title), 'Avg grade']];

    const body = students.map((student) => {
      const marks = studentMarksByExerciseId[student.id] || {};
      const row: string[] = [student?.profile?.fullname ?? ''];
      exercises.forEach((ex) => {
        row.push(marks[ex.id] ?? '-');
      });
      const avg = calculateStudentAverage(marks, exercises);
      row.push(avg != null ? String(avg) : '-');
      return row;
    });

    autoTable(doc, {
      head,
      body,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] },
      footStyles: { fillColor: [22, 160, 133] },
      didDrawPage: function (data) {
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text(`${courseTitle} - Marks`, data.settings.margin.left, 10);
      }
    });
    doc.save(`${courseTitle}-marks.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
