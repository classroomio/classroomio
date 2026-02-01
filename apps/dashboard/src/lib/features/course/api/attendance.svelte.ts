import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';

import type { InferResponseType } from '@cio/api/rpc-types';
import type { TAttendanceUpsert } from '@cio/utils/validation/attendance';
import type { UpsertAttendanceRequest } from '../utils/types';
import { ZAttendanceUpsert } from '@cio/utils/validation/attendance';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$features/ui/snackbar/store';

type UpsertAttendanceResponse = Extract<InferResponseType<UpsertAttendanceRequest>, { success: true }>;

/**
 * API class for attendance operations
 */
export class AttendanceApi extends BaseApiWithErrors {
  /**
   * Creates or updates an attendance record
   */
  async upsert(fields: TAttendanceUpsert): Promise<UpsertAttendanceResponse | undefined> {
    const result = ZAttendanceUpsert.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'attendance');
      return undefined;
    }

    return await this.execute<UpsertAttendanceRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].attendance.$post({
          param: { courseId: fields.courseId },
          json: result.data
        }),
      logContext: 'upserting attendance',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Attendance recorded successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to record attendance');
          return;
        }
        if ('error' in result && 'field' in result && result.field) {
          this.errors[result.field] = result.error;
          snackbar.error(result.error);
        } else if ('error' in result) {
          this.errors.general = result.error;
          snackbar.error(result.error);
        }
      }
    });
  }

  /**
   * Updates an attendance record
   * NOTE: Use upsert() instead - no separate update route exists
   */
  async update(fields: TAttendanceUpsert) {
    // Use upsert since there's no separate update route
    return this.upsert(fields);
  }
}

export const attendanceApi = new AttendanceApi();
