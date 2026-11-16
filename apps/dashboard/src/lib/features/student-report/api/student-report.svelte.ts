import type { TStudentReportCreate } from '@cio/utils/validation/student-report';

import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { snackbar } from '$features/ui/snackbar/store';

import type {
  CreateStudentReportRequest,
  CreatedStudentReport,
  ListStudentReportsRequest,
  RevokeStudentReportRequest,
  StudentReportHistoryItem
} from '../utils/types';

class StudentReportApi extends BaseApiWithErrors {
  history = $state<StudentReportHistoryItem[]>([]);

  async create(courseId: string, body: TStudentReportCreate): Promise<CreatedStudentReport[] | null> {
    let reports: CreatedStudentReport[] | null = null;

    await this.execute<CreateStudentReportRequest>({
      requestFn: () => classroomio.course[':courseId']['student-report'].$post({ param: { courseId }, json: body }),
      logContext: 'creating student reports',
      onSuccess: (response) => {
        reports = response.data.reports;
      },
      onError: (error) => {
        snackbar.error(error.message);
      }
    });

    return reports;
  }

  async loadHistory(courseId: string, profileId: string) {
    await this.execute<ListStudentReportsRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['student-report'].$get({ param: { courseId }, query: { profileId } }),
      logContext: 'loading student reports',
      onSuccess: (response) => {
        this.history = response.data;
      }
    });
  }

  async revoke(courseId: string, reportId: string): Promise<boolean> {
    let revoked = false;

    await this.execute<RevokeStudentReportRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['student-report'][':reportId'].$delete({ param: { courseId, reportId } }),
      logContext: 'revoking a student report',
      onSuccess: () => {
        revoked = true;
        snackbar.success('student_report.snackbar.revoked');
      },
      onError: (error) => {
        snackbar.error(error.message);
      }
    });

    return revoked;
  }
}

export const studentReportApi = /* @__PURE__ */ new StudentReportApi();
