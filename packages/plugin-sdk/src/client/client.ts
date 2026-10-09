import {
  type BridgeHandshakeAck,
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
  applyThemeTokensToRoot,
  DEFAULT_LIGHT_THEME_V1,
  isBridgeHandshakeInit,
  isBridgeRpcResponse,
  BRIDGE_PROTOCOL_VERSION
} from '../bridge/protocol';

export class PluginBridgeError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(`[ClassroomIO Bridge Error] ${code}: ${message}`);
    this.name = 'PluginBridgeError';
    this.code = code;
  }
}

export interface ClassroomIOClientOptions {
  timeoutMs?: number;
  targetWindow?: Window;
}

export class ClassroomIOClient {
  private port: MessagePort | null = null;
  private contextPromise: Promise<PluginContext>;
  private resolveContext!: (ctx: PluginContext) => void;
  private currentTheme: PluginThemeV1 = DEFAULT_LIGHT_THEME_V1;
  private themeListeners = new Set<(theme: PluginThemeV1) => void>();
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (reason: any) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  private timeoutMs: number;
  private isDestroyed = false;

  constructor(options: ClassroomIOClientOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 5000;
    const win = options.targetWindow ?? (typeof window !== 'undefined' ? window : null);

    this.contextPromise = new Promise<PluginContext>((resolve) => {
      this.resolveContext = resolve;
    });

    if (win) {
      this.initHandshakeListener(win);
    }
  }

  /**
   * For testing or manual initialization with an already established port and context
   */
  public attachPort(port: MessagePort, context: PluginContext, theme?: PluginThemeV1) {
    this.port = port;
    this.port.onmessage = this.handlePortMessage.bind(this);
    if (theme) {
      this.currentTheme = theme;
      applyThemeTokensToRoot(theme);
    }
    this.resolveContext(context);
  }

  private initHandshakeListener(win: Window) {
    const handleInitialMessage = (event: MessageEvent) => {
      if (!isBridgeHandshakeInit(event.data)) {
        return;
      }

      const port = event.ports[0];
      if (!port) {
        return;
      }

      this.port = port;
      this.port.onmessage = this.handlePortMessage.bind(this);

      // Listen for the context returned from host or acknowledge handshake
      const ackMessage: BridgeHandshakeAck = {
        type: 'CIO_BRIDGE_HANDSHAKE_ACK',
        protocolVersion: BRIDGE_PROTOCOL_VERSION,
        nonce: event.data.nonce,
        context: {
          installationId: '',
          pluginId: '',
          version: '',
          organizationId: null,
          userId: null
        }
      };

      this.port.postMessage(ackMessage);
      win.removeEventListener('message', handleInitialMessage);
    };

    win.addEventListener('message', handleInitialMessage);
  }

  private handlePortMessage(event: MessageEvent) {
    if (this.isDestroyed) return;

    const data = event.data;

    // Handle context initialization from host
    if (data?.type === 'CIO_BRIDGE_CONTEXT_INIT') {
      if (data.context) {
        this.resolveContext(data.context);
      }
      if (data.theme) {
        this.currentTheme = data.theme;
        applyThemeTokensToRoot(data.theme);
        for (const listener of this.themeListeners) {
          listener(data.theme);
        }
      }
      return;
    }

    if (data?.type === 'CIO_THEME_CHANGE' && data.theme) {
      this.currentTheme = data.theme;
      applyThemeTokensToRoot(data.theme);
      for (const listener of this.themeListeners) {
        listener(data.theme);
      }
      return;
    }

    if (isBridgeRpcResponse(data)) {
      const pending = this.pendingRequests.get(data.id);
      if (!pending) return;

      clearTimeout(pending.timer);
      this.pendingRequests.delete(data.id);

      if (data.success) {
        pending.resolve(data.data);
      } else {
        const err = data.error ?? { code: 'INTERNAL_ERROR', message: 'Unknown RPC error' };
        pending.reject(new PluginBridgeError(err.code, err.message));
      }
    }
  }

  public async rpc<TResponse = unknown, TPayload = unknown>(action: string, payload: TPayload): Promise<TResponse> {
    if (this.isDestroyed) {
      throw new PluginBridgeError('INTERNAL_ERROR', 'Client has been destroyed');
    }

    // Wait until context is established (and hence port is available)
    await this.contextPromise;

    if (!this.port) {
      throw new PluginBridgeError('INTERNAL_ERROR', 'MessagePort not initialized');
    }

    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    return new Promise<TResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new PluginBridgeError('TIMEOUT', `RPC request "${action}" timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });

      const requestMessage: BridgeRpcRequest<TPayload> = {
        type: 'CIO_RPC_REQUEST',
        id,
        action,
        payload
      };

      this.port!.postMessage(requestMessage);
    });
  }

  public context = {
    get: async (): Promise<PluginContext> => {
      return this.contextPromise;
    }
  };

  public auth = {
    requestLaunchCode: async (options?: BridgeLaunchCodeRequestPayload): Promise<BridgeLaunchCodeResponseData> => {
      return this.rpc<BridgeLaunchCodeResponseData, BridgeLaunchCodeRequestPayload>(
        'auth:requestLaunchCode',
        options ?? {}
      );
    }
  };

  public storage = {
    get: async <T = unknown>(key: string, namespace: string = 'default'): Promise<T | null> => {
      return this.rpc<T | null, BridgeStorageGetPayload>('storage:get', { namespace, key });
    },
    set: async <T = unknown>(key: string, value: T, namespace: string = 'default'): Promise<void> => {
      return this.rpc<void, BridgeStorageSetPayload>('storage:set', { namespace, key, value });
    },
    delete: async (key: string, namespace: string = 'default'): Promise<boolean> => {
      return this.rpc<boolean, BridgeStorageDeletePayload>('storage:delete', { namespace, key });
    }
  };

  public ui = {
    toast: async (options: BridgeToastPayload): Promise<void> => {
      return this.rpc<void, BridgeToastPayload>('ui:toast', options);
    },
    openModal: async (options: BridgeModalOpenPayload): Promise<void> => {
      return this.rpc<void, BridgeModalOpenPayload>('ui:modal:open', options);
    },
    closeModal: async (): Promise<void> => {
      return this.rpc<void, Record<string, never>>('ui:modal:close', {});
    }
  };

  public theme = {
    get: async (): Promise<PluginThemeV1> => {
      await this.contextPromise;
      return this.currentTheme;
    },
    current: (): PluginThemeV1 => this.currentTheme,
    onChange: (callback: (theme: PluginThemeV1) => void): (() => void) => {
      this.themeListeners.add(callback);
      return () => {
        this.themeListeners.delete(callback);
      };
    }
  };

  public destroy() {
    this.isDestroyed = true;
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timer);
      pending.reject(new PluginBridgeError('INTERNAL_ERROR', 'Bridge client destroyed'));
    }
    this.pendingRequests.clear();
    if (this.port) {
      this.port.close();
      this.port = null;
    }
  }
}

export function createClassroomIOClient(options?: ClassroomIOClientOptions): ClassroomIOClient {
  return new ClassroomIOClient(options);
}
