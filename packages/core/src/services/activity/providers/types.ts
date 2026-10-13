import type { DbOrTxClient } from '@cio/db/drizzle';
import type { TAsset, TContentPackageUnit, TContentPackageVersion } from '@cio/db/types';
import type { LaunchMode } from '@cio/activity-packages';
import type { LicenseFeatureId } from '@cio/utils/license';
import type { TActivityKind } from '@cio/utils/constants/activity';
import type { TScormResultsQuery } from '@cio/utils/validation/activity/report';
import type { TScormLaunchMode, TScormSettings } from '@cio/utils/validation/activity/scorm';

export interface ActivityProvider {
  kind: TActivityKind;
  licenseFeature: LicenseFeatureId;
  singleActivityCourse: { navLabelKey: string; courseLabelKey: string };
  /** Creates the kind's detail rows for a new activity inside the caller's transaction. */
  createDetails(activityId: string, input: unknown, tx: DbOrTxClient): Promise<void>;
  /** Returns the kind's editor data: package, versions, settings, warnings. */
  getEditorData(activityId: string): Promise<ActivityEditorData>;
  /** Validates and saves kind settings. Throws AppError on invalid input. */
  updateSettings(activityId: string, input: unknown, tx: DbOrTxClient): Promise<void>;
  /** Resolves what a launch opens: the player URL, mode and modules. Never writes completion. */
  launch(context: ActivityLaunchContext): Promise<ActivityLaunchResult>;
  /** Summary rows for the Results tab and People pages. */
  listLearnerSummaries(
    activityId: string,
    profileIds: string[],
    paging?: TScormResultsQuery
  ): Promise<ActivityLearnerSummary[]>;
  getResultsSummary(activityId: string, profileIds: string[]): Promise<ActivityResultsSummary>;
  getLearnerDetail(activityId: string, profileId: string): Promise<ActivityLearnerDetail>;
  /** Deletes the kind's learner state for these activities and this profile, inside the caller's transaction. */
  resetLearner(activityIds: string[], profileId: string, tx: DbOrTxClient): Promise<number>;
  /** Copies the kind's detail rows (never learner state) to a new activity, in or across organizations. */
  copy(source: ActivityCopySource, target: ActivityCopyTarget, tx: DbOrTxClient): Promise<void>;
  /** Removes the kind's rows and asset usages before the activity row is deleted. */
  delete(activityId: string, tx: DbOrTxClient): Promise<void>;
  /** Go-live blockers, such as a package with no ready version. */
  goLiveBlockers(activityId: string): Promise<GoLiveBlocker[]>;
  /** Score, attempts and minutes for the compliance snapshot. */
  complianceSnapshot(activityId: string, profileId: string): Promise<ActivityComplianceSnapshot | null>;
}

export type ActivityEditorData =
  | {
      available: false;
      message: string;
    }
  | {
      available: true;
      kind: 'scorm';
      settings: TScormSettings;
      package: {
        asset: TAsset;
        versions: TContentPackageVersion[];
        currentVersion: TContentPackageVersion | null;
        units: TContentPackageUnit[];
      } | null;
    };

export type ActivityLaunchContext = {
  activityId: string;
  courseId: string;
  profileId: string;
  organizationId: string;
  unitIdentifier?: string;
  newAttempt?: boolean;
  isPreview: boolean;
};

export type ScormLaunchModule = {
  identifier: string;
  title: string;
  position: number;
  completed: boolean;
  scorePercent: number | null;
  status: 'not_attempted' | 'active' | 'suspended' | 'closed';
};

export type ScormLaunchUnit = {
  identifier: string;
  title: string;
  href: string;
  position: number;
};

export type ActivityLaunchResult =
  | {
      available: false;
      message: string;
    }
  | {
      available: true;
      playerUrl: string;
      mode: LaunchMode;
      expiresAt: string;
      launchMode: TScormLaunchMode;
      unit: ScormLaunchUnit;
      units: ScormLaunchModule[];
      reviewOfArchivedVersion?: boolean;
    };

export type ActivityResultsSummary = {
  enrolled: number;
  started: number;
  completed: number;
  passed: number;
  averageScore: number | null;
};

export type ActivityLearnerStatus = 'not_started' | 'in_progress' | 'failed' | 'completed';
export type ActivityLearnerPassFail = 'passed' | 'failed' | null;

export type ActivityLearnerSummary = {
  profileId: string;
  fullname: string | null;
  email: string | null;
  status: ActivityLearnerStatus;
  passFail: ActivityLearnerPassFail;
  scorePercent: number | null;
  bestScorePercent: number | null;
  timeSpentSeconds: number;
  attempts: number;
  lastLaunchedAt: string | null;
};

export interface ActivityLearnerInteraction {
  index: number;
  id: string | null;
  type: string | null;
  studentResponse: string | null;
  result: string | null;
  latency: string | null;
  description: string | null;
  correctResponse: string | null;
}

export interface ActivityLearnerAttemptModule {
  unitId: string;
  identifier: string;
  title: string;
  position: number;
  tryId: string | null;
  status: string;
  completion: string;
  success: string;
  hasPassMark: boolean;
  scaledScorePercent: number | null;
  timeSpentSeconds: number;
  location: string | null;
  exit: string | null;
  lastCommitAt: string | null;
  interactions: ActivityLearnerInteraction[];
  events: ActivityModuleEvent[];
}

export interface ActivityModuleEvent {
  kind: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityLearnerAttempt {
  attemptNumber: number;
  packageVersionNumber: number | null;
  startedAt: string;
  closedAt: string | null;
  closeReason: string | null;
  scorePercent: number | null;
  ruleMet: boolean;
  modules: ActivityLearnerAttemptModule[];
}

export type ActivityLearnerDetail = {
  profileId: string;
  attempts: ActivityLearnerAttempt[];
};

export type ActivityCopySource = {
  activityId: string;
  organizationId: string | null;
};

export type ActivityCopyTarget = {
  activityId: string;
  organizationId: string | null;
  userId: string;
};

export type GoLiveBlocker = {
  code: string;
  message: string;
  target?: string;
};

export type ActivityComplianceSnapshot = {
  score: number | null;
  attempts: number;
  minutes: number;
};
