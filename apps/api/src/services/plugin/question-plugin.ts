import { getInstallationGrants, getQuestionPluginResolutionData } from '@cio/db/queries/plugin';
import type {
  PluginQuestionSettingsEnvelope,
  QuestionPluginLifecycleState,
  QuestionPluginMode
} from '@cio/question-types';
import { getPluginArtifactBaseUrl, normalizePluginEntrypointPath } from './installation';

export interface QuestionPluginResolutionResult {
  state: QuestionPluginLifecycleState;
  lifecycleState: QuestionPluginLifecycleState;
  canTake: boolean;
  canReview: boolean;
  canEdit: boolean;
  upgradeAvailable: boolean;
  pinnedVersion: string;
  installedVersion: string | null;
  contribution: Record<string, unknown> | null;
  installationId?: string;
  artifactUrl?: string;
  artifactDigest?: string;
  grantedScopes?: string[];
  reason?: string;
}

export async function resolveQuestionPluginContext(params: {
  organizationId: string;
  envelope: PluginQuestionSettingsEnvelope;
  mode?: QuestionPluginMode;
}): Promise<QuestionPluginResolutionResult> {
  const { organizationId, envelope } = params;

  const data = await getQuestionPluginResolutionData({
    organizationId,
    pluginId: envelope.pluginId,
    pinnedVersion: envelope.pluginVersion,
    installationId: envelope.installationId
  });

  const pinnedVersion = envelope.pluginVersion;
  const installedVersion = data.installedVersion?.version ?? null;
  let upgradeAvailable = Boolean(
    installedVersion && installedVersion !== pinnedVersion && data.installation?.status === 'active'
  );

  if (!data.plugin || data.plugin.status === 'revoked') {
    return {
      state: 'revoked',
      lifecycleState: 'revoked',
      canTake: false,
      canReview: false,
      canEdit: false,
      upgradeAvailable: false,
      pinnedVersion,
      installedVersion,
      contribution: null,
      reason: 'Plugin is revoked'
    };
  }

  if (!data.installation || data.installation.status === 'uninstalled') {
    return {
      state: 'uninstalled',
      lifecycleState: 'uninstalled',
      canTake: false,
      canReview: true,
      canEdit: false,
      upgradeAvailable: false,
      pinnedVersion,
      installedVersion,
      contribution: null,
      reason: 'Plugin is not installed in this organization'
    };
  }

  if (data.installation.status === 'revoked') {
    return {
      state: 'revoked',
      lifecycleState: 'revoked',
      canTake: false,
      canReview: false,
      canEdit: false,
      upgradeAvailable: false,
      pinnedVersion,
      installedVersion,
      contribution: null,
      reason: 'Plugin installation is revoked'
    };
  }

  if (data.installation.status === 'disabled') {
    return {
      state: 'disabled',
      lifecycleState: 'disabled',
      canTake: false,
      canReview: true,
      canEdit: false,
      upgradeAvailable,
      pinnedVersion,
      installedVersion,
      contribution: null,
      reason: 'Plugin is disabled by the organization'
    };
  }

  if (!data.pinnedVersion || data.pinnedVersion.reviewStatus === 'rejected') {
    return {
      state: 'unavailable',
      lifecycleState: 'unavailable',
      canTake: false,
      canReview: false,
      canEdit: false,
      upgradeAvailable,
      pinnedVersion,
      installedVersion,
      contribution: null,
      reason: 'Pinned plugin version is unavailable or rejected'
    };
  }

  if (envelope.artifactDigest && data.pinnedVersion.artifactDigest) {
    if (envelope.artifactDigest !== data.pinnedVersion.artifactDigest) {
      if (params.mode === 'edit') {
        upgradeAvailable = true;
      } else {
        return {
          state: 'unavailable',
          lifecycleState: 'unavailable',
          canTake: false,
          canReview: false,
          canEdit: false,
          upgradeAvailable,
          pinnedVersion,
          installedVersion,
          contribution: null,
          reason: 'Pinned artifact digest does not match release artifact'
        };
      }
    }
  }

  const manifest = (data.pinnedVersion.manifest ?? {}) as Record<string, unknown>;
  const contributes = (manifest.contributes ?? {}) as Record<string, unknown>;
  const questionTypes = Array.isArray(contributes.questionTypes)
    ? (contributes.questionTypes as Array<Record<string, unknown>>)
    : [];
  const contribution = questionTypes.find((qt) => qt.id === envelope.contributionId) ?? null;

  if (!contribution) {
    return {
      state: 'unavailable',
      lifecycleState: 'unavailable',
      canTake: false,
      canReview: true,
      canEdit: false,
      upgradeAvailable,
      pinnedVersion,
      installedVersion,
      contribution: null,
      reason: `Contribution "${envelope.contributionId}" not found in pinned plugin manifest`
    };
  }

  const artifactDigest = data.pinnedVersion.artifactDigest;
  let artifactUrl: string | undefined = undefined;

  const targetMode = params.mode ?? 'take';
  const entrypoints = (contribution.entrypoints ?? {}) as Record<string, string>;
  const entrypointName = entrypoints[targetMode] ?? entrypoints.take ?? entrypoints.edit ?? 'question';

  const ui = (manifest.runtime as Record<string, unknown> | undefined)?.ui as Record<string, unknown> | undefined;
  const uiEntrypoints = (ui?.entrypoints ?? {}) as Record<string, unknown>;
  const rawEntry = uiEntrypoints[entrypointName];
  const entrypointPath =
    typeof rawEntry === 'string'
      ? rawEntry
      : rawEntry && typeof rawEntry === 'object' && 'resource' in rawEntry
        ? String((rawEntry as { resource?: unknown }).resource ?? '')
        : undefined;

  if (artifactDigest && entrypointPath) {
    const artifactBaseUrl = getPluginArtifactBaseUrl(envelope.pluginId, data.pinnedVersion.version, artifactDigest);
    artifactUrl = `${artifactBaseUrl}/${normalizePluginEntrypointPath(entrypointPath)}`;
  }

  const grants = data.installation ? await getInstallationGrants(data.installation.id) : [];
  const grantedScopes = grants.map((g) => g.scope);

  return {
    state: 'active',
    lifecycleState: 'active',
    canTake: true,
    canReview: true,
    canEdit: true,
    upgradeAvailable,
    pinnedVersion,
    installedVersion,
    contribution,
    installationId: data.installation.id,
    artifactUrl,
    artifactDigest: artifactDigest ?? undefined,
    grantedScopes
  };
}
