import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { snackbar } from '$features/ui/snackbar/store';
import { mapZodErrorsToTranslations } from '$lib/utils/validation/validation';
import { ZPackageCreate } from '@cio/utils/validation/activity/package';
import { ZActivityCoursesCreate } from '@cio/utils/validation/activity/course';
import type { TPackageCreate, TPackageVersionCreate } from '@cio/utils/validation/activity/package';
import type { TActivityCoursesCreate } from '@cio/utils/validation/activity/course';
import type {
  CreatedPackageCourses,
  CreateCoursesFromPackagesRequest,
  CreatePackageData,
  CreatePackageRequest,
  CreatePackageVersionData,
  CreatePackageVersionRequest,
  GetPackageDownloadRequest,
  GetPackageRequest,
  MakePackageVersionCurrentRequest,
  PackageDetails,
  ProcessPackageVersionRequest
} from '../utils/types';

/**
 * API class for SCORM content packages: presigned ZIP upload intents,
 * processing triggers, version promotion and reads.
 */
export class PackageApi extends BaseApiWithErrors {
  async create(fields: TPackageCreate): Promise<CreatePackageData | undefined> {
    const result = ZPackageCreate.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'activity');
      return;
    }
    this.errors = {};
    let created: CreatePackageData | undefined;
    await this.execute<CreatePackageRequest>({
      requestFn: () => classroomio.activity.packages.$post({ json: result.data }),
      logContext: 'creating package',
      onSuccess: (response) => {
        if (response.data) {
          created = response.data;
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        this.success = false;
        if (typeof result === 'string') {
          snackbar.error('snackbar.activity.upload_failed');
          return;
        }
        if ('error' in result) {
          this.errors.general = result.error;
          snackbar.error(result.error);
        }
      }
    });

    return created;
  }

  async createVersion(assetId: string, fields: TPackageVersionCreate = {}) {
    let created: CreatePackageVersionData | undefined;
    await this.execute<CreatePackageVersionRequest>({
      requestFn: () => classroomio.activity.packages[':assetId'].versions.$post({ param: { assetId }, json: fields }),
      logContext: 'creating package version',
      onSuccess: (response) => {
        if (response.data) {
          created = response.data;
          this.success = true;
        }
      },
      onError: (result) => {
        this.success = false;
        if (typeof result !== 'string' && 'error' in result) snackbar.error(result.error);
      }
    });

    return created;
  }

  async process(assetId: string, versionId: string) {
    let jobId: string | undefined;
    await this.execute<ProcessPackageVersionRequest>({
      requestFn: () =>
        classroomio.activity.packages[':assetId'].versions[':versionId'].process.$post({
          param: { assetId, versionId }
        }),
      logContext: 'processing package version',
      onSuccess: (response) => {
        if (response.data) {
          jobId = response.data.jobId;
          this.success = true;
        }
      },
      onError: (result) => {
        this.success = false;
        if (typeof result !== 'string' && 'error' in result) snackbar.error(result.error);
      }
    });

    return jobId;
  }

  async makeCurrent(assetId: string, versionId: string, closeOpenAttempts = false, activityId?: string) {
    let closedAttempts = 0;
    const payload = activityId ? { closeOpenAttempts, activityId } : { closeOpenAttempts };
    await this.execute<MakePackageVersionCurrentRequest>({
      requestFn: () =>
        classroomio.activity.packages[':assetId'].versions[':versionId'].current.$post({
          param: { assetId, versionId },
          json: payload
        }),
      logContext: 'promoting package version',
      onSuccess: (response) => {
        if (response.data) {
          closedAttempts = response.data.closedAttempts;
          this.success = true;
        }
      },
      onError: (result) => {
        this.success = false;
        if (typeof result !== 'string' && 'error' in result) snackbar.error(result.error);
      }
    });

    return closedAttempts;
  }

  async get(assetId: string): Promise<PackageDetails | undefined> {
    let details: PackageDetails | undefined;
    await this.execute<GetPackageRequest>({
      requestFn: () => classroomio.activity.packages[':assetId'].$get({ param: { assetId } }),
      logContext: 'fetching package',
      onSuccess: (response) => {
        if (response.data) details = response.data;
      }
    });

    return details;
  }

  async getDownloadUrl(assetId: string): Promise<string | null> {
    let url: string | null = null;
    await this.execute<GetPackageDownloadRequest>({
      requestFn: () => classroomio.activity.packages[':assetId'].download.$get({ param: { assetId } }),
      logContext: 'building package download',
      onSuccess: (response) => {
        if (response.data) url = response.data.url;
      },
      onError: () => {
        snackbar.error('snackbar.media_manager.download_failed');
      }
    });

    return url;
  }

  async createCourses(fields: TActivityCoursesCreate): Promise<CreatedPackageCourses | undefined> {
    const result = ZActivityCoursesCreate.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'activity');
      return;
    }
    this.errors = {};
    let created: CreatedPackageCourses | undefined;
    await this.execute<CreateCoursesFromPackagesRequest>({
      requestFn: () => classroomio.activity.courses.$post({ json: result.data }),
      logContext: 'creating courses from packages',
      onSuccess: (response) => {
        if (response.data) {
          created = response.data;
          this.success = true;
          this.errors = {};
          snackbar.success('snackbar.activity.courses_created');
        }
      },
      onError: (result) => {
        this.success = false;
        if (typeof result === 'string') {
          snackbar.error('snackbar.activity.courses_create_failed');
          return;
        }
        if ('error' in result) {
          this.errors.general = result.error;
          snackbar.error(result.error);
        }
      }
    });

    return created;
  }
}

export const packageApi = /* @__PURE__ */ new PackageApi();
