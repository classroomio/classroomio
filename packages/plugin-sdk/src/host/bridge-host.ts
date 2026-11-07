import {
  type BridgeHandshakeInit,
  type BridgeResizePayload,
  type BridgeNavigationOpenPayload,
  type BridgeRpcRequest,
  type BridgeRpcResponse,
  type BridgeToastPayload,
  type PluginContext,
  type PluginThemeV1,
  type BridgeSetDirtyPayload,
  type BridgeStorageGetPayload,
  type BridgeStorageSetPayload,
  type BridgeStorageDeletePayload,
  type BridgeStorageListPayload,
  type BridgeTemplateSelectionPayload,
  type BridgeCertificateTemplateApplyPayload,
  BRIDGE_MAX_REQUEST_BYTES,
  BRIDGE_MAX_RESPONSE_BYTES,
  DEFAULT_LIGHT_THEME_V1,
  BRIDGE_PROTOCOL_VERSION,
  isBridgeRpcRequest,
  isValidBridgeRpcPayload
} from '../bridge/protocol';

export interface PluginBridgeHostHandlers {
  onToast?: (payload: BridgeToastPayload) => Promise<void>;
  onResize?: (payload: BridgeResizePayload) => Promise<void>;
  onNavigate?: (payload: BridgeNavigationOpenPayload) => Promise<void>;
  onSetDirty?: (payload: BridgeSetDirtyPayload) => Promise<void>;
  onPreferenceGet?: (payload: { key: string; namespace?: string }) => Promise<unknown>;
  onPreferenceSet?: (payload: { key: string; value: unknown; namespace?: string }) => Promise<void>;
  onPreferenceDelete?: (payload: { key: string; namespace?: string }) => Promise<boolean | void>;
  onStorageGet?: (payload: BridgeStorageGetPayload) => Promise<unknown>;
  onStorageGetRecord?: (payload: BridgeStorageGetPayload) => Promise<unknown>;
  onStorageSet?: (payload: BridgeStorageSetPayload) => Promise<unknown>;
  onStorageDelete?: (payload: BridgeStorageDeletePayload) => Promise<boolean | void>;
  onStorageList?: (payload: BridgeStorageListPayload) => Promise<unknown>;
  onLandingTemplatePreview?: (payload: BridgeTemplateSelectionPayload) => Promise<unknown>;
  onLandingTemplateSelect?: (payload: BridgeTemplateSelectionPayload) => Promise<unknown>;
  onCertificateTemplateApply?: (payload: BridgeCertificateTemplateApplyPayload) => Promise<unknown>;
  onDataRequest?: (action: string, payload: Record<string, unknown>) => Promise<unknown>;
}

export interface PluginBridgeHostOptions {
  iframe: HTMLIFrameElement;
  targetOrigin: string;
  context: PluginContext;
  theme?: PluginThemeV1;
  handlers: PluginBridgeHostHandlers;
}

function serializePluginContext(context: PluginContext): PluginContext {
  return JSON.parse(JSON.stringify(context)) as PluginContext;
}

export class PluginBridgeHost {
  private port: MessagePort | null = null;
  private channel: MessageChannel | null = null;
  private isDestroyed = false;
  private nonce: string;
  private options: PluginBridgeHostOptions;

  constructor(options: PluginBridgeHostOptions) {
    this.options = {
      ...options,
      context: serializePluginContext(options.context)
    };
    this.nonce = crypto.randomUUID();
  }

  public getHandshakeNonce(): string {
    return this.nonce;
  }

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

    if (data?.type === 'CIO_BRIDGE_HANDSHAKE_ACK' && data.nonce === this.nonce) {
      this.port.postMessage({
        type: 'CIO_BRIDGE_CONTEXT_INIT',
        context: this.options.context,
        theme: this.options.theme ?? DEFAULT_LIGHT_THEME_V1
      });
      return;
    }

    if (isBridgeRpcRequest(data)) {
      if (JSON.stringify(data).length > BRIDGE_MAX_REQUEST_BYTES) return;
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
        case 'ui:storage:get': {
          if (!this.options.handlers.onStorageGet) {
            resultData = null;
          } else {
            resultData = await this.options.handlers.onStorageGet(request.payload as BridgeStorageGetPayload);
          }
          break;
        }
        case 'ui:storage:getRecord': {
          if (!this.options.handlers.onStorageGetRecord) {
            resultData = null;
          } else {
            resultData = await this.options.handlers.onStorageGetRecord(request.payload as BridgeStorageGetPayload);
          }
          break;
        }
        case 'ui:storage:set': {
          if (this.options.handlers.onStorageSet) {
            resultData = await this.options.handlers.onStorageSet(request.payload as BridgeStorageSetPayload);
          }
          break;
        }
        case 'ui:storage:delete': {
          if (!this.options.handlers.onStorageDelete) {
            resultData = true;
          } else {
            resultData = await this.options.handlers.onStorageDelete(request.payload as BridgeStorageDeletePayload);
          }
          break;
        }
        case 'ui:storage:list': {
          if (!this.options.handlers.onStorageList) {
            resultData = [];
          } else {
            resultData = await this.options.handlers.onStorageList(request.payload as BridgeStorageListPayload);
          }
          break;
        }
        case 'landing.templates:preview': {
          if (!this.options.handlers.onLandingTemplatePreview) {
            throw { code: 'NOT_SUPPORTED', message: 'Landing template previews are unavailable in this surface' };
          }
          resultData = await this.options.handlers.onLandingTemplatePreview(
            request.payload as BridgeTemplateSelectionPayload
          );
          break;
        }
        case 'landing.templates:select': {
          if (!this.options.handlers.onLandingTemplateSelect) {
            throw { code: 'NOT_SUPPORTED', message: 'Landing template selection is unavailable in this surface' };
          }
          resultData = await this.options.handlers.onLandingTemplateSelect(
            request.payload as BridgeTemplateSelectionPayload
          );
          break;
        }
        case 'certificate.templates:apply': {
          if (!this.options.handlers.onCertificateTemplateApply) {
            throw { code: 'NOT_SUPPORTED', message: 'Certificate template selection is unavailable in this surface' };
          }
          resultData = await this.options.handlers.onCertificateTemplateApply(
            request.payload as BridgeCertificateTemplateApplyPayload
          );
          break;
        }
        case 'capabilities:list': {
          resultData = this.options.context.capabilities ?? [];
          break;
        }
        case 'identity:getCurrent':
        case 'organization:getProfile':
        case 'courses:list':
        case 'courses:get':
        case 'courses:getStructure':
        case 'lessons:list':
        case 'lessons:get':
        case 'lessons:getContent':
        case 'exercises:list':
        case 'exercises:get':
        case 'progress:getLesson':
        case 'progress:getCourse':
        case 'progress:setCompletion':
        case 'certificates:list':
        case 'certificates:get':
        case 'certificateTemplates:list':
        case 'certificateTemplates:getApplied': {
          if (!this.options.handlers.onDataRequest) {
            throw { code: 'NOT_SUPPORTED', message: 'Hosted data is unavailable in this surface' };
          }
          resultData = await this.options.handlers.onDataRequest(
            request.action,
            request.payload as Record<string, unknown>
          );
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

      if (JSON.stringify(response).length > BRIDGE_MAX_RESPONSE_BYTES) {
        throw { code: 'RESPONSE_TOO_LARGE', message: 'RPC response exceeds the bridge size limit' };
      }

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
