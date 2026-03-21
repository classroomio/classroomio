import type {
  AutomationKey,
  AutomationKeyType,
  AutomationUsage,
  CreateAutomationKeyRequest,
  GetAutomationUsageRequest,
  ListAutomationKeysRequest,
  RevokeAutomationKeyRequest,
  RotateAutomationKeyRequest
} from '$features/automation/utils/types';
import { getDefaultAutomationKeyLabel } from '$features/automation/utils/automation-utils';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';

import { snackbar } from '$features/ui/snackbar/store';

class AutomationApi extends BaseApiWithErrors {
  generatedSecret = $state<string | null>(null);
  isFetched = $state(false);
  keys = $state<AutomationKey[]>([]);
  usage = $state<AutomationUsage | null>(null);

  async listKeys(type?: AutomationKeyType) {
    return this.execute<ListAutomationKeysRequest>({
      requestFn: () =>
        classroomio.organization.automation.keys.$get({
          query: type ? { type } : {}
        }),
      logContext: 'fetching automation keys',
      onSuccess: (response) => {
        this.keys = response.data;
        this.isFetched = true;
      }
    });
  }

  async getUsage(type: AutomationKeyType = 'mcp') {
    return this.execute<GetAutomationUsageRequest>({
      requestFn: () =>
        classroomio.organization.automation.usage.$get({
          query: { type }
        }),
      logContext: 'fetching automation usage',
      onSuccess: (response) => {
        this.usage = response.data;
      }
    });
  }

  async createKey(type: AutomationKeyType, label?: string) {
    return this.execute<CreateAutomationKeyRequest>({
      requestFn: () =>
        classroomio.organization.automation.keys.$post({
          json: {
            type,
            label: label?.trim() || getDefaultAutomationKeyLabel(type)
          }
        }),
      logContext: 'creating automation key',
      onSuccess: (response) => {
        this.generatedSecret = response.data.secret;
        this.keys = [response.data.key, ...this.keys];
        if (this.usage) {
          this.usage = { ...this.usage, activeKeys: this.usage.activeKeys + 1 };
        }
        snackbar.success('snackbar.automation.created');
      },
      onError: (result) => {
        if (typeof result === 'string') {
          return;
        }

        this.handleValidationError(result);

        if ('field' in result && result.field) {
          this.errors[result.field] = result.error;
        }
      }
    });
  }

  async revokeKey(keyId: string) {
    return this.execute<RevokeAutomationKeyRequest>({
      requestFn: () => classroomio.organization.automation.keys[':keyId'].$delete({ param: { keyId } }),
      logContext: 'revoking automation key',
      onSuccess: (response) => {
        this.keys = this.keys.map((key) => (key.id === response.data.id ? response.data : key));
        if (this.usage) {
          const activeKeys = this.keys.filter((key) => key.type === 'mcp' && !key.revokedAt).length;
          this.usage = { ...this.usage, activeKeys };
        }
        snackbar.success('snackbar.automation.revoked');
      }
    });
  }

  async rotateKey(keyId: string) {
    return this.execute<RotateAutomationKeyRequest>({
      requestFn: () => classroomio.organization.automation.keys[':keyId'].rotate.$post({ param: { keyId } }),
      logContext: 'rotating automation key',
      onSuccess: (response) => {
        this.generatedSecret = response.data.secret;
        this.keys = this.keys.map((key) => (key.id === response.data.key.id ? response.data.key : key));
        snackbar.success('snackbar.automation.rotated');
      }
    });
  }

  clearGeneratedSecret() {
    this.generatedSecret = null;
  }
}

export const automationApi = new AutomationApi();
