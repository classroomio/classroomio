import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { ZCreateSsoConnection, ZUpdateSsoConnection, ZUpdateSsoPolicy } from '@cio/utils/validation/organization/sso';
import type {
  TCreateSsoConnection,
  TUpdateSsoConnection,
  TUpdateSsoPolicy
} from '@cio/utils/validation/organization/sso';

import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';
import { normalizeSsoConfig, normalizeSsoPolicy } from '../utils/sso';
import type {
  ActivateSsoConnectionRequest,
  CreateSsoConnectionRequest,
  DeleteSsoConnectionRequest,
  GetOrgSsoInfoRequest,
  GetSsoConfigRequest,
  OrgSsoInfo,
  SsoConfig,
  SsoDiscoveryRequest,
  SsoDiscoveryResult,
  UpdateSsoConnectionRequest,
  UpdateSsoPolicyRequest
} from '../utils/types';

/**
 * API class for SSO operations
 */
class SsoApi extends BaseApiWithErrors {
  config = $state<SsoConfig | null>(null);

  /**
   * Fetch SSO configuration for current org
   */
  async getSsoConfig() {
    return this.execute<GetSsoConfigRequest>({
      requestFn: () => classroomio.organization.sso.$get(),
      logContext: 'fetching SSO configuration',
      onSuccess: (response) => {
        if (response.data != null && typeof response.data === 'object') {
          this.config = normalizeSsoConfig(response.data);
        } else {
          this.config = null;
        }
      }
    });
  }

  /**
   * Create new SSO connection
   */
  async createConnection(data: TCreateSsoConnection) {
    const result = ZCreateSsoConnection.safeParse(data);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return;
    }

    return this.execute<CreateSsoConnectionRequest>({
      requestFn: () =>
        classroomio.organization.sso.$post({
          json: result.data
        }),
      logContext: 'creating SSO connection',
      onSuccess: (response) => {
        snackbar.success(t.get('snackbar.success_update'));
        this.config = {
          config: response.data,
          policy: this.config?.policy ?? null
        };
      },
      onError: (error) => {
        if (typeof error === 'string') {
          snackbar.error(error);
        } else if ('error' in error) {
          snackbar.error(error.error);
        }
      }
    });
  }

  /**
   * Update SSO connection
   */
  async updateConnection(data: TUpdateSsoConnection) {
    const result = ZUpdateSsoConnection.safeParse(data);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return;
    }

    return this.execute<UpdateSsoConnectionRequest>({
      requestFn: () =>
        classroomio.organization.sso.$put({
          json: result.data
        }),
      logContext: 'updating SSO connection',
      onSuccess: (response) => {
        snackbar.success(t.get('snackbar.success_update'));
        if (this.config?.config) {
          this.config.config = { ...this.config.config, ...response.data };
        }
      }
    });
  }

  /**
   * Delete SSO connection
   */
  async deleteConnection() {
    return this.execute<DeleteSsoConnectionRequest>({
      requestFn: () => classroomio.organization.sso.$delete(),
      logContext: 'deleting SSO connection',
      onSuccess: () => {
        snackbar.success(t.get('snackbar.success_update'));
        this.config = null;
      }
    });
  }

  /**
   * Activate SSO connection
   */
  async activateConnection() {
    return this.execute<ActivateSsoConnectionRequest>({
      requestFn: () => classroomio.organization.sso.activate.$post(),
      logContext: 'activating SSO connection',
      onSuccess: (response) => {
        snackbar.success('SSO connection activated');
        if (this.config?.config) {
          this.config.config.isActive = response.data?.isActive ?? true;
        }
      }
    });
  }

  /**
   * Update SSO policy
   */
  async updatePolicy(data: TUpdateSsoPolicy) {
    const result = ZUpdateSsoPolicy.safeParse(data);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return;
    }

    return this.execute<UpdateSsoPolicyRequest>({
      requestFn: () =>
        classroomio.organization.sso.policy.$put({
          json: result.data
        }),
      logContext: 'updating SSO policy',
      onSuccess: (response) => {
        snackbar.success(t.get('snackbar.success_update'));
        if (this.config) {
          this.config.policy = normalizeSsoPolicy(response.data);
        }
      }
    });
  }

  /**
   * Discover SSO for email
   */
  async discoverSso(email: string): Promise<SsoDiscoveryResult | null> {
    const result = await this.execute<SsoDiscoveryRequest>({
      requestFn: () =>
        classroomio.sso.discover.$get({
          query: { email }
        }),
      logContext: 'discovering SSO'
    });

    return result?.data ?? null;
  }

  /**
   * Get SSO info for org
   */
  async getOrgSsoInfo(orgId: string): Promise<OrgSsoInfo | null> {
    const result = await this.execute<GetOrgSsoInfoRequest>({
      requestFn: () =>
        classroomio.sso.org[':orgId'].$get({
          param: { orgId }
        }),
      logContext: 'fetching org SSO info'
    });

    return result?.data ?? null;
  }
}

export const ssoApi = new SsoApi();
