import {
  type BridgeHandshakeInit,
  type BridgeModalOpenPayload,
  type BridgeRpcRequest,
  type BridgeRpcResponse,
  type BridgeStorageDeletePayload,
  type BridgeStorageGetPayload,
  type BridgeStorageSetPayload,
  type BridgeToastPayload,
  type BridgeLaunchCodeRequestPayload,
  type BridgeLaunchCodeResponseData,
  type PluginContext,
  type PluginThemeV1,
  DEFAULT_LIGHT_THEME_V1,
  BRIDGE_PROTOCOL_VERSION
} from '../bridge/protocol';

export interface PluginBridgeHostHandlers {
  onStorageGet?: (namespace: string, key: string) => Promise<unknown>;
  onStorageSet?: (namespace: string, key: string, value: unknown) => Promise<void>;
  onStorageDelete?: (namespace: string, key: string) => Promise<boolean>;
  onToast?: (payload: BridgeToastPayload) => Promise<void>;
  onOpenModal?: (payload: BridgeModalOpenPayload) => Promise<void>;
  onCloseModal?: () => Promise<void>;
  onRequestLaunchCode?: (payload: BridgeLaunchCodeRequestPayload) => Promise<BridgeLaunchCodeResponseData>;
  onCustomRpc?: (action: string, payload: unknown) => Promise<unknown>;
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
    this.nonce = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
    if (data?.type === 'CIO_RPC_REQUEST' && typeof data.id === 'string' && typeof data.action === 'string') {
      const request = data as BridgeRpcRequest;
      await this.dispatchRpc(request);
    }
  }

  private async dispatchRpc(request: BridgeRpcRequest) {
    if (!this.port) return;

    try {
      let resultData: unknown = undefined;

      switch (request.action) {
        case 'storage.get':
        case 'storage:get': {
          const payload = request.payload as BridgeStorageGetPayload;
          if (this.options.handlers.onStorageGet) {
            resultData = await this.options.handlers.onStorageGet(payload.namespace, payload.key);
          }
          break;
        }
        case 'storage.set':
        case 'storage:set': {
          const payload = request.payload as BridgeStorageSetPayload;
          if (this.options.handlers.onStorageSet) {
            await this.options.handlers.onStorageSet(payload.namespace, payload.key, payload.value);
          }
          break;
        }
        case 'storage.delete':
        case 'storage:delete': {
          const payload = request.payload as BridgeStorageDeletePayload;
          if (this.options.handlers.onStorageDelete) {
            resultData = await this.options.handlers.onStorageDelete(payload.namespace, payload.key);
          }
          break;
        }
        case 'toast':
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
        default: {
          if (this.options.handlers.onCustomRpc) {
            resultData = await this.options.handlers.onCustomRpc(request.action, request.payload);
          } else {
            throw { code: 'NOT_FOUND', message: `Unknown RPC action: ${request.action}` };
          }
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
