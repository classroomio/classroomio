import Papa from 'papaparse';

export interface ExportProgressCourseRow {
  courseTitle: string;
  progress: number;
  exercisesCompleted: number;
  exercisesCount: number;
  averageGrade: number | null;
}

export interface ExportProgressExerciseRow {
  exerciseTitle: string;
  lessonTitle: string;
  score: number | null;
  totalPoints: number;
  status: string;
}

function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export a student's per-course progress across an org as a CSV download.
 */
export function exportOrgStudentProgress(rows: ExportProgressCourseRow[], studentName: string): void {
  const data = rows.map((row) => ({
    course: row.courseTitle,
    progress: `${row.progress}%`,
    exercises_completed: `${row.exercisesCompleted}/${row.exercisesCount}`,
    average_grade: row.averageGrade === null ? '—' : `${row.averageGrade}%`
  }));

  downloadCsv(`${studentName}-progress.csv`, data);
}

/**
 * Export a student's per-exercise progress inside one course as a CSV download.
 */
export function exportCourseStudentProgress(rows: ExportProgressExerciseRow[], studentName: string): void {
  const data = rows.map((row) => ({
    exercise: row.exerciseTitle,
    lesson: row.lessonTitle,
    score: row.score === null ? '—' : `${row.score}/${row.totalPoints}`,
    status: row.status
  }));

  downloadCsv(`${studentName}-${rows.length}-exercises.csv`, data);
}
