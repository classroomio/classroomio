import { BaseApiWithErrors, classroomio, hasErrorCode } from '$lib/utils/services/api';
import { ErrorCodes } from '@cio/utils/constants';
import { ZCreateContentReport, type TCreateContentReport } from '@cio/utils/validation/report';
import type { CreateContentReportRequest } from '../utils/types';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$features/ui/snackbar/store';

class ReportApi extends BaseApiWithErrors {
  async submit(fields: TCreateContentReport) {
    const result = ZCreateContentReport.safeParse(fields);

    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'report');
      return;
    }

    await this.execute<CreateContentReportRequest>({
      requestFn: () => classroomio.report.$post({ json: result.data }),
      logContext: 'submitting content report',
      onSuccess: () => {
        snackbar.success('snackbar.report.success');
        this.success = true;
        this.errors = {};
      },
      onError: (response) => {
        if (hasErrorCode(response, ErrorCodes.REPORT_ALREADY_SUBMITTED)) {
          snackbar.error('snackbar.report.already_submitted');
          return;
        }

        snackbar.error('snackbar.report.error');
        this.handleValidationError(response);
      }
    });
  }
}

export const reportApi = new ReportApi();
