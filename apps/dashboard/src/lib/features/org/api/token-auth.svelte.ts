import type {
  ActivateTokenAuthRequest,
  CreateTokenAuthRequest,
  DeleteTokenAuthRequest,
  GetTokenAuthRequest,
  RotateTokenAuthRequest
} from '$features/org/utils/types';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';

import { snackbar } from '$features/ui/snackbar/store';

export interface TokenAuthStatus {
  isActive: boolean;
  createdAt: string;
  secretLast4: string | null;
}

const tokenAuthClient = (
  classroomio.organization as {
    'token-auth': {
      $get: () => Promise<Response>;
      $post: () => Promise<Response>;
      $delete: () => Promise<Response>;
      rotate: { $post: () => Promise<Response> };
      activate: { $put: (opts: { json: { isActive: boolean } }) => Promise<Response> };
    };
  }
)['token-auth'];

class TokenAuthApi extends BaseApiWithErrors {
  tokenAuth = $state<TokenAuthStatus | null>(null);
  generatedSecret = $state<string | null>(null);
  isFetched = $state(false);

  async getStatus() {
    return this.execute<GetTokenAuthRequest>({
      requestFn: () => tokenAuthClient.$get(),
      logContext: 'fetching token auth status',
      onSuccess: (response) => {
        this.tokenAuth = response.data;
        this.isFetched = true;
      }
    });
  }

  async generateSecret() {
    return this.execute<CreateTokenAuthRequest>({
      requestFn: () => tokenAuthClient.$post(),
      logContext: 'creating token auth',
      onSuccess: (response) => {
        this.generatedSecret = response.data?.secret ?? null;
        this.tokenAuth = response.data
          ? {
              isActive: response.data.isActive,
              createdAt: response.data.createdAt,
              secretLast4: response.data.secret ? response.data.secret.slice(-4) : null
            }
          : null;
        snackbar.success('snackbar.token_auth.created');
      }
    });
  }

  async rotateSecret() {
    return this.execute<RotateTokenAuthRequest>({
      requestFn: () => tokenAuthClient.rotate.$post(),
      logContext: 'rotating token auth secret',
      onSuccess: (response) => {
        this.generatedSecret = response.data?.secret ?? null;
        snackbar.success('snackbar.token_auth.rotated');
      }
    });
  }

  async deleteTokenAuth() {
    return this.execute<DeleteTokenAuthRequest>({
      requestFn: () => tokenAuthClient.$delete(),
      logContext: 'deleting token auth',
      onSuccess: () => {
        this.tokenAuth = null;
        this.generatedSecret = null;
        snackbar.success('snackbar.token_auth.deleted');
      }
    });
  }

  async activateTokenAuth(isActive: boolean) {
    return this.execute<ActivateTokenAuthRequest>({
      requestFn: () => tokenAuthClient.activate.$put({ json: { isActive } }),
      logContext: 'updating token auth activation',
      onSuccess: () => {
        if (this.tokenAuth) {
          this.tokenAuth = { ...this.tokenAuth, isActive };
        }
        snackbar.success(isActive ? 'snackbar.token_auth.activated' : 'snackbar.token_auth.deactivated');
      }
    });
  }
}

export const tokenAuthApi = new TokenAuthApi();
