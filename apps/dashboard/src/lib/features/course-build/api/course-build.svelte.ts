import { BaseApi, classroomio } from '$lib/utils/services/api';

import { COURSE_BUILD_POLL_INTERVAL_MS, isCourseBuildActive } from '../utils/course-build-utils';
import type { CourseBuildSummary, LatestCourseBuildRequest } from '../utils/types';

/** The organization's latest website course build, for the Courses page. */
class CourseBuildApi extends BaseApi {
  latest = $state<CourseBuildSummary | null>(null);

  async loadLatest() {
    await this.execute<LatestCourseBuildRequest>({
      requestFn: () => classroomio.organization['course-build'].latest.$get(),
      logContext: 'loading the latest course build',
      onSuccess: (response) => {
        this.latest = response.data;
      }
    });
  }

  /** Reloads the latest build until it ends or `signal` aborts. */
  async pollLatest(signal: AbortSignal) {
    while (!signal.aborted) {
      await this.loadLatest();
      if (!isCourseBuildActive(this.latest)) return;

      await new Promise<void>((done) => {
        const timer = setTimeout(done, COURSE_BUILD_POLL_INTERVAL_MS);
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            done();
          },
          { once: true }
        );
      });
    }
  }
}

export const courseBuildApi = new CourseBuildApi();
