import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';

import {
  FIRST_PAGE,
  studentCoursesSpec,
  studentScoresSpec,
  nextSort,
  pageAfterEmptyResult,
  selectedStudentCourseSpec
} from '../utils/insights-utils';
import type { InsightsPageState, InsightsResult, InsightsRow, SelectedStudent } from '../utils/types';
import { insightsApi } from './insights.svelte';

class InsightsStudentSheetApi {
  isOpen = $state(false);
  student = $state<SelectedStudent | null>(null);
  courseId = $state<string | null>(null);
  courses = $state<InsightsResult | null>(null);
  coursesPage = $state<InsightsPageState>(FIRST_PAGE);
  scores = $state<InsightsResult | null>(null);
  courseRow = $state<InsightsRow | null>(null);
  isLoading = $state(false);
  failed = $state(false);

  #seq = 0;
  #loadedStudentId: string | null = null;
  #openedOnCourseId: string | null = null;

  /**
   * Opens the sheet on the dashboard's picked course, or on the student's courses when none is picked.
   * Reopening the same student on the same dashboard course keeps where the sheet was.
   */
  async openFor(student: SelectedStudent) {
    const dashboardCourseId = insightsApi.selection.courseId;
    const isSame = this.#loadedStudentId === student.id && this.#openedOnCourseId === dashboardCourseId;
    this.student = student;
    this.isOpen = true;
    if (isSame && !this.failed) return;

    this.#openedOnCourseId = dashboardCourseId;
    this.courseId = dashboardCourseId;
    this.coursesPage = FIRST_PAGE;
    this.courses = null;
    this.scores = null;
    this.courseRow = null;

    await this.load();
  }

  close() {
    this.isOpen = false;
  }

  async setCoursesPage(page: number) {
    this.coursesPage = { page, sort: this.coursesPage.sort };

    await this.load();
  }

  /**
   * Sorts the student's courses on the server, from the first page; the same column again flips the direction.
   */
  async setCoursesSort(key: string) {
    this.coursesPage = { page: 1, sort: nextSort(this.coursesPage.sort, key) };

    await this.load();
  }

  /**
   * Drills the sheet into one course, or back to the student's courses. The dashboard behind it stays as it is.
   */
  async selectCourse(courseId: string | null) {
    this.courseId = courseId;
    this.scores = null;
    this.courseRow = null;

    await this.load();
  }

  /**
   * Reloads the open sheet after the range, a poll or Refresh changed the data it shows.
   */
  async reloadIfOpen(options: { refresh?: boolean } = {}) {
    if (!this.isOpen) return;

    await this.load(options);
  }

  async load(options: { refresh?: boolean } = {}) {
    const student = this.student;
    if (!student) return;

    this.#seq += 1;
    const seq = this.#seq;
    const courseId = this.courseId;
    this.isLoading = true;
    this.failed = false;

    if (courseId) {
      const scoresSpec = studentScoresSpec(student.id, courseId, insightsApi.selection.range);
      const courseSpec = selectedStudentCourseSpec(student.id, courseId);
      const [scores, course] = await Promise.all([
        insightsApi.sharedQuery(scoresSpec, options),
        insightsApi.sharedQuery(courseSpec, options)
      ]);
      if (seq !== this.#seq) return;

      this.scores = scores;
      this.courseRow = course?.rows[0] ?? null;
      this.failed = !scores || !course;
    } else {
      const coursesSpec = studentCoursesSpec(student.id, this.coursesPage);
      const courses = await insightsApi.sharedQuery(coursesSpec, options);
      if (seq !== this.#seq) return;

      if (courses && courses.rows.length === 0 && this.coursesPage.page > 1) {
        const nextPage = pageAfterEmptyResult(this.coursesPage.page, courses.total, INSIGHTS_LIMITS.cardPageSize);
        this.coursesPage = { page: nextPage, sort: this.coursesPage.sort };
        await this.load(options);
        return;
      }

      this.courses = courses;
      this.failed = !courses;
    }

    this.#loadedStudentId = student.id;
    this.isLoading = false;
  }

  reset() {
    this.#seq += 1;
    this.isOpen = false;
    this.student = null;
    this.courseId = null;
    this.coursesPage = FIRST_PAGE;
    this.courses = null;
    this.scores = null;
    this.courseRow = null;
    this.isLoading = false;
    this.failed = false;
    this.#loadedStudentId = null;
    this.#openedOnCourseId = null;
  }
}

export const insightsStudentSheetApi = new InsightsStudentSheetApi();
