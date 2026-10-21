import {
  type BridgeHandshakeInit,
  type BridgeModalOpenPayload,
  type BridgeResizePayload,
  type BridgeNavigationOpenPayload,
  type BridgeRpcRequest,
  type BridgeRpcResponse,
  type BridgeToastPayload,
  type BridgeLaunchCodeRequestPayload,
  type BridgeLaunchCodeResponseData,
  type PluginContext,
  type PluginThemeV1,
  type BridgeSetDirtyPayload,
  DEFAULT_LIGHT_THEME_V1,
  BRIDGE_PROTOCOL_VERSION,
  isBridgeRpcRequest,
  isValidBridgeRpcPayload
} from '../bridge/protocol';

export interface PluginBridgeHostHandlers {
  onToast?: (payload: BridgeToastPayload) => Promise<void>;
  onOpenModal?: (payload: BridgeModalOpenPayload) => Promise<void>;
  onCloseModal?: () => Promise<void>;
  onResize?: (payload: BridgeResizePayload) => Promise<void>;
  onNavigate?: (payload: BridgeNavigationOpenPayload) => Promise<void>;
  onRequestLaunchCode?: (payload: BridgeLaunchCodeRequestPayload) => Promise<BridgeLaunchCodeResponseData>;
  onSetDirty?: (payload: BridgeSetDirtyPayload) => Promise<void>;
  onStorageGet?: (payload: { key: string; namespace?: string; scope?: string }) => Promise<unknown>;
  onStorageSet?: (payload: { key: string; value: unknown; namespace?: string; scope?: string }) => Promise<void>;
  onStorageDelete?: (payload: { key: string; namespace?: string; scope?: string }) => Promise<boolean | void>;
  onStorageList?: (payload: { namespace: string; scope?: string }) => Promise<unknown>;
  onPreferenceGet?: (payload: { key: string; namespace?: string }) => Promise<unknown>;
  onPreferenceSet?: (payload: { key: string; value: unknown; namespace?: string }) => Promise<void>;
  onPreferenceDelete?: (payload: { key: string; namespace?: string }) => Promise<boolean | void>;
  onCertificateTemplatesApply?: (payload: any) => Promise<any>;
}

export interface PluginBridgeHostOptions {
  iframe: HTMLIFrameElement;
  targetOrigin: string;
  context: PluginContext;
  theme?: PluginThemeV1;
  handlers: PluginBridgeHostHandlers;
}

export class PluginBridgeHost {
  private port: MessagePort | null = null;
  private channel: MessageChannel | null = null;
  private isDestroyed = false;
  private nonce: string;

  constructor(private options: PluginBridgeHostOptions) {
    this.nonce = crypto.randomUUID();
  }

  public getHandshakeNonce(): string {
    return this.nonce;
  }

  /**
   * For headless testing or manual connection with an existing port
   */
  public attachPort(port: MessagePort) {
    this.port = port;
    this.port.onmessage = this.handlePortMessage.bind(this);
    this.port.postMessage({
      type: 'CIO_BRIDGE_CONTEXT_INIT',
      context: this.options.context,
      theme: this.options.theme ?? DEFAULT_LIGHT_THEME_V1
    });
  }

  public startHandshake() {
    if (this.isDestroyed) return;

    this.channel = new MessageChannel();
    this.port = this.channel.port1;
    this.port.onmessage = this.handlePortMessage.bind(this);

    const initMessage: BridgeHandshakeInit = {
      type: 'CIO_BRIDGE_HANDSHAKE_INIT',
      protocolVersion: BRIDGE_PROTOCOL_VERSION,
      nonce: this.nonce,
      origin: this.options.targetOrigin
    };

    const targetWindow = this.options.iframe.contentWindow;
    if (!targetWindow) {
      throw new Error('[ClassroomIO Bridge Host] iframe.contentWindow is null');
    }

    targetWindow.postMessage(initMessage, this.options.targetOrigin, [this.channel.port2]);
  }

  private async handlePortMessage(event: MessageEvent) {
    if (this.isDestroyed || !this.port) return;

    const data = event.data;

    // Handle handshake acknowledgment
    if (data?.type === 'CIO_BRIDGE_HANDSHAKE_ACK' && data.nonce === this.nonce) {
      this.port.postMessage({
        type: 'CIO_BRIDGE_CONTEXT_INIT',
        context: this.options.context,
        theme: this.options.theme ?? DEFAULT_LIGHT_THEME_V1
      });
      return;
    }

    // Handle RPC requests from plugin
    if (isBridgeRpcRequest(data)) {
      await this.dispatchRpc(data);
    }
  }

  private async dispatchRpc(request: BridgeRpcRequest) {
    if (!this.port) return;

    try {
      if (!isValidBridgeRpcPayload(request.action, request.payload)) {
        throw { code: 'INVALID_PARAMS', message: `Invalid payload for ${request.action}` };
      }

      let resultData: unknown = undefined;

      switch (request.action) {
        case 'ui:toast': {
          const payload = request.payload as BridgeToastPayload;
          if (this.options.handlers.onToast) {
            await this.options.handlers.onToast(payload);
          }
          break;
        }
        case 'ui:modal:open': {
          const payload = request.payload as BridgeModalOpenPayload;
          if (this.options.handlers.onOpenModal) {
            await this.options.handlers.onOpenModal(payload);
          }
          break;
        }
        case 'ui:modal:close': {
          if (this.options.handlers.onCloseModal) {
            await this.options.handlers.onCloseModal();
          }
          break;
        }
        case 'ui:resize': {
          const payload = request.payload as BridgeResizePayload;
          if (this.options.handlers.onResize) {
            await this.options.handlers.onResize(payload);
          }
          break;
        }
        case 'navigation:open': {
          const payload = request.payload as BridgeNavigationOpenPayload;
          if (!this.options.handlers.onNavigate) {
            throw { code: 'FORBIDDEN', message: 'Navigation is unavailable in this surface' };
          }
          await this.options.handlers.onNavigate(payload);
          break;
        }
        case 'auth:requestLaunchCode': {
          const payload = request.payload as BridgeLaunchCodeRequestPayload;
          if (this.options.handlers.onRequestLaunchCode) {
            resultData = await this.options.handlers.onRequestLaunchCode(payload);
          } else {
            throw {
              code: 'FORBIDDEN',
              message: 'Backend launch code requests are not supported in this host context'
            };
          }
          break;
        }
        case 'ui:setDirty': {
          const payload = request.payload as BridgeSetDirtyPayload;
          if (typeof payload?.dirty !== 'boolean') {
            throw { code: 'INVALID_PARAMS', message: 'dirty must be a boolean' };
          }
          if (this.options.handlers.onSetDirty) {
            await this.options.handlers.onSetDirty(payload);
          }
          break;
        }
        case 'ui:storage:get': {
          if (this.options.handlers.onStorageGet) {
            resultData = await this.options.handlers.onStorageGet(request.payload as any);
          } else {
            resultData = null;
          }
          break;
        }
        case 'ui:storage:set': {
          if (this.options.handlers.onStorageSet) {
            await this.options.handlers.onStorageSet(request.payload as any);
          }
          break;
        }
        case 'ui:storage:delete': {
          if (this.options.handlers.onStorageDelete) {
            resultData = await this.options.handlers.onStorageDelete(request.payload as any);
          } else {
            resultData = true;
          }
          break;
        }
        case 'ui:storage:list': {
          if (this.options.handlers.onStorageList) {
            resultData = await this.options.handlers.onStorageList(request.payload as any);
          } else {
            resultData = [];
          }
          break;
        }
        case 'ui:preferences:get': {
          if (this.options.handlers.onPreferenceGet) {
            resultData = await this.options.handlers.onPreferenceGet(request.payload as any);
          } else {
            resultData = null;
          }
          break;
        }
        case 'ui:preferences:set': {
          if (this.options.handlers.onPreferenceSet) {
            await this.options.handlers.onPreferenceSet(request.payload as any);
          }
          break;
        }
        case 'ui:preferences:delete': {
          if (this.options.handlers.onPreferenceDelete) {
            resultData = await this.options.handlers.onPreferenceDelete(request.payload as any);
          } else {
            resultData = true;
          }
          break;
        }
        case 'certificateTemplates:apply': {
          if (this.options.handlers.onCertificateTemplatesApply) {
            resultData = await this.options.handlers.onCertificateTemplatesApply(request.payload);
          } else {
            throw {
              code: 'NOT_SUPPORTED',
              message: 'certificateTemplates:apply capability is not supported in this surface context'
            };
          }
          break;
        }
        default: {
          throw { code: 'NOT_FOUND', message: `Unknown host capability: ${request.action}` };
        }
      }

      const response: BridgeRpcResponse = {
        type: 'CIO_RPC_RESPONSE',
        id: request.id,
        success: true,
        data: resultData
      };

      this.port.postMessage(response);
    } catch (err: any) {
      const errorPayload = {
        code: err?.code ?? 'INTERNAL_ERROR',
        message: err?.message ?? String(err)
      };

      const errorResponse: BridgeRpcResponse = {
        type: 'CIO_RPC_RESPONSE',
        id: request.id,
        success: false,
        error: errorPayload
      };

      this.port.postMessage(errorResponse);
    }
  }

  public setTheme(theme: PluginThemeV1): void {
    this.options.theme = theme;
    if (this.port) {
      this.port.postMessage({
        type: 'CIO_THEME_CHANGE',
        theme
      });
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.port) {
      this.port.close();
      this.port = null;
    }
  }
}
