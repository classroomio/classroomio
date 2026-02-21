import type { CourseMembers } from '$features/course/utils/types';
import type { Marks } from './types';

export type LessonSummary = {
  id: string;
  title: string;
};
import Papa from 'papaparse';
import autoTable from 'jspdf-autotable';
import { getLectureNo } from './functions';
import jsPDF from 'jspdf';

/** Exercise information for display in marks table */
export interface ExerciseInfo {
  title: string;
  points: number;
}

/** Maps lessonId -> exerciseId -> exercise info */
export type LessonExerciseMapping = {
  [lessonId: string]: {
    [exerciseId: string]: ExerciseInfo;
  };
};

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
  lessonMapping: LessonExerciseMapping;
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
 * Extract unique exercise/lesson combinations from marks to build lesson mapping
 * This eliminates the need for a separate exercises API call since marks already contain exercise info
 * @param marks Array of mark records from API
 * @returns Nested object structure mapping lessonId -> exerciseId -> exercise info
 */
export function processMarksIntoLessonMapping(marks: Marks): LessonExerciseMapping {
  const result: LessonExerciseMapping = {};

  if (!Array.isArray(marks)) return result;

  // Use a Set to track unique exercise/lesson combinations
  const seen = new Set<string>();

  marks.forEach((mark) => {
    const { lessonId, exerciseId, exerciseTitle, exercisePoints } = mark;

    if (!lessonId || !exerciseId) return;

    // Create unique key to avoid duplicates
    const key = `${lessonId}-${exerciseId}`;
    if (seen.has(key)) return;
    seen.add(key);

    const exerciseInfo: ExerciseInfo = {
      title: exerciseTitle || '',
      points: exercisePoints ?? 0
    };

    if (result[lessonId]) {
      result[lessonId] = {
        ...result[lessonId],
        [exerciseId]: exerciseInfo
      };
    } else {
      result[lessonId] = {
        [exerciseId]: exerciseInfo
      };
    }
  });

  return result;
}

/**
 * Generate and download CSV export of marks
 * @param students Array of students
 * @param lessons Array of lessons for ordering
 * @param lessonMapping Lesson to exercise mapping
 * @param studentMarksByExerciseId Student marks by exercise
 * @param courseTitle Course title for filename
 */
export function generateMarksCSV(
  students: CourseMembers,
  lessons: LessonSummary[],
  lessonMapping: LessonExerciseMapping,
  studentMarksByExerciseId: StudentMarksByExercise,
  courseTitle: string
): void {
  const exportData = students.map((student) => {
    const rowData: Record<string, string | number> = {
      name: student.profile?.fullname || '',
      email: student.profile?.email || '',
      Total: 0
    };

    const totalPoints = calculateStudentTotal(studentMarksByExerciseId[student.id]);
    lessons.forEach((lesson, lessonIndex) => {
      const quizzes = lessonMapping[lesson.id] || {};
      const quizMark = studentMarksByExerciseId[student.id] || {};
      Object.keys(quizzes).forEach((quizId) => {
        const quiz = quizzes[quizId];
        const key = `L${lessonIndex + 1} - ${quiz.title} (${lesson.title})`;
        rowData[key] = quizMark[quizId] || '-';
      });
    });
    rowData['Total'] = totalPoints;
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
 * Generate and download PDF export of marks
 * @param students Array of students
 * @param lessons Array of lessons for ordering
 * @param lessonMapping Lesson to exercise mapping
 * @param studentMarksByExerciseId Student marks by exercise
 * @param courseTitle Course title for filename and header
 */
export function generateMarksPDF(
  students: CourseMembers,
  lessons: LessonSummary[],
  lessonMapping: LessonExerciseMapping,
  studentMarksByExerciseId: StudentMarksByExercise,
  courseTitle: string
): void {
  try {
    const doc = new jsPDF({ orientation: 'landscape' });
    const head = [['Student']];

    lessons.forEach((lesson, lessonIndex) => {
      if (lessonMapping[lesson.id]) {
        Object.values(lessonMapping[lesson.id]).forEach((exercise) => {
          head[0].push(`${getLectureNo(lessonIndex + 1)} - ${exercise.title} (${lesson.title})`);
        });
      }
    });
    head[0].push('Total');

    const body = students.map((student) => {
      const row: string[] = [];
      row.push(student?.profile?.fullname ?? '');
      lessons.forEach((lesson) => {
        if (lessonMapping[lesson.id]) {
          Object.keys(lessonMapping[lesson.id]).forEach((exerciseId) => {
            const mark: string = studentMarksByExerciseId?.[student.id]?.[exerciseId] || '-';
            row.push(mark);
          });
        }
      });
      const total = '' + calculateStudentTotal(studentMarksByExerciseId[student.id]);
      row.push(total);
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
