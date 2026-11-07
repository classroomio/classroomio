import {
  type BridgeHandshakeAck,
  type BridgeHandshakeInit,
  type BridgeResizePayload,
  type BridgeNavigationOpenPayload,
  type BridgeRpcRequest,
  type BridgeRpcResponse,
  type BridgeToastPayload,
  type PluginContext,
  type PluginThemeV1,
  type BridgeSetDirtyPayload,
  type BridgePreferenceDeletePayload,
  type BridgePreferenceGetPayload,
  type BridgePreferenceSetPayload,
  type BridgeStorageGetPayload,
  type BridgeStorageSetPayload,
  type BridgeStorageDeletePayload,
  type BridgeStorageListPayload,
  type BridgeCoursesListPayload,
  type BridgeIdPayload,
  type BridgeListPayload,
  type BridgeProgressSetPayload,
  type BridgeTemplateSelectionPayload,
  type BridgeCertificateTemplateApplyPayload,
  applyThemeTokensToRoot,
  DEFAULT_LIGHT_THEME_V1,
  isBridgeHandshakeInit,
  isBridgeRpcResponse,
  BRIDGE_PROTOCOL_VERSION,
  BRIDGE_MAX_REQUEST_BYTES,
  BRIDGE_MAX_RESPONSE_BYTES
} from '../bridge/protocol';
import type {
  PluginAppliedCertificateTemplate,
  PluginCertificateTemplate,
  PluginCourseMetadata,
  PluginCourseProgress,
  PluginCourseStructure,
  PluginCursorPage,
  PluginExerciseMetadata,
  PluginIdentityProfile,
  PluginIssuedCertificate,
  PluginLessonContent,
  PluginLessonMetadata,
  PluginLessonProgress,
  PluginOrganizationProfile
} from '../data-types';

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
      if (event.source !== win.parent) {
        return;
      }

      if (!isBridgeHandshakeInit(event.data)) {
        return;
      }

      const port = event.ports[0];
      if (!port) {
        return;
      }

      this.port = port;
      this.port.onmessage = this.handlePortMessage.bind(this);

      const ackMessage: BridgeHandshakeAck = {
        type: 'CIO_BRIDGE_HANDSHAKE_ACK',
        protocolVersion: BRIDGE_PROTOCOL_VERSION,
        nonce: event.data.nonce,
        context: {
          installationId: '',
          pluginId: '',
          version: ''
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
      if (JSON.stringify(data).length > BRIDGE_MAX_RESPONSE_BYTES) {
        return;
      }
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

  private async rpc<TResponse = unknown, TPayload = unknown>(action: string, payload: TPayload): Promise<TResponse> {
    if (this.isDestroyed) {
      throw new PluginBridgeError('INTERNAL_ERROR', 'Client has been destroyed');
    }

    await this.contextPromise;

    if (!this.port) {
      throw new PluginBridgeError('INTERNAL_ERROR', 'MessagePort not initialized');
    }

    const id = crypto.randomUUID();

    return new Promise<TResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new PluginBridgeError('TIMEOUT', `RPC request "${action}" timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });

      const safePayload = payload !== undefined ? JSON.parse(JSON.stringify(payload)) : payload;

      const requestMessage: BridgeRpcRequest<TPayload> = {
        type: 'CIO_RPC_REQUEST',
        id,
        action,
        payload: safePayload
      };

      if (JSON.stringify(requestMessage).length > BRIDGE_MAX_REQUEST_BYTES) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(new PluginBridgeError('INVALID_PARAMS', 'RPC request exceeds the bridge size limit'));
        return;
      }

      this.port!.postMessage(requestMessage);
    });
  }

  public context = {
    get: async (): Promise<PluginContext> => {
      return this.contextPromise;
    }
  };

  public capabilities = {
    list: async (): Promise<string[]> => this.rpc<string[], Record<string, never>>('capabilities:list', {})
  };

  public identity = {
    getCurrent: async (): Promise<PluginIdentityProfile> =>
      this.rpc<PluginIdentityProfile, Record<string, never>>('identity:getCurrent', {})
  };

  public organization = {
    getProfile: async (): Promise<PluginOrganizationProfile> =>
      this.rpc<PluginOrganizationProfile, Record<string, never>>('organization:getProfile', {})
  };

  public ui = {
    toast: async (options: BridgeToastPayload): Promise<void> => {
      return this.rpc<void, BridgeToastPayload>('ui:toast', options);
    },
    resize: async (height: number): Promise<void> => {
      return this.rpc<void, BridgeResizePayload>('ui:resize', { height });
    },
    setDirty: async (dirty: boolean): Promise<void> => {
      return this.rpc<void, BridgeSetDirtyPayload>('ui:setDirty', { dirty });
    }
  };

  public navigation = {
    open: async (href: string): Promise<void> => {
      return this.rpc<void, BridgeNavigationOpenPayload>('navigation:open', { href });
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

  public preferences = {
    get: async <T = unknown>(key: string, namespace = 'default'): Promise<T | null> => {
      return this.rpc<T | null, BridgePreferenceGetPayload>('ui:preferences:get', { key, namespace });
    },
    set: async <T = unknown>(key: string, value: T, namespace = 'default'): Promise<void> => {
      await this.rpc<void, BridgePreferenceSetPayload>('ui:preferences:set', { key, value, namespace });
    },
    delete: async (key: string, namespace = 'default'): Promise<boolean> => {
      return this.rpc<boolean, BridgePreferenceDeletePayload>('ui:preferences:delete', { key, namespace });
    }
  };

  public storage = {
    get: async <T = unknown>(
      key: string,
      namespace = 'default',
      scope: 'organization' | 'user' | 'resource' = 'organization'
    ): Promise<T | null> => {
      return this.rpc<T | null, BridgeStorageGetPayload>('ui:storage:get', { key, namespace, scope });
    },
    getRecord: async <T = unknown>(
      key: string,
      namespace = 'default',
      scope: 'organization' | 'user' | 'resource' = 'organization'
    ): Promise<{ value: T; version: number; schemaVersion: number; updatedAt: string } | null> => {
      return this.rpc('ui:storage:getRecord', { key, namespace, scope });
    },
    set: async <T = unknown>(
      key: string,
      value: T,
      namespace = 'default',
      scope: 'organization' | 'user' | 'resource' = 'organization',
      options: { schemaVersion?: number; expectedVersion?: number } = {}
    ): Promise<{ version: number; schemaVersion: number }> => {
      return this.rpc<{ version: number; schemaVersion: number }, BridgeStorageSetPayload>('ui:storage:set', {
        key,
        value,
        namespace,
        scope,
        schemaVersion: options.schemaVersion ?? 1,
        expectedVersion: options.expectedVersion
      });
    },
    delete: async (
      key: string,
      namespace = 'default',
      scope: 'organization' | 'user' | 'resource' = 'organization'
    ): Promise<boolean> => {
      return this.rpc<boolean, BridgeStorageDeletePayload>('ui:storage:delete', { key, namespace, scope });
    },
    list: async <T = unknown>(
      namespace = 'default',
      scope: 'organization' | 'user' | 'resource' = 'organization',
      options: { cursor?: string; limit?: number } = {}
    ): Promise<{
      items: Array<{ key: string; value: T; version: number; schemaVersion: number; updatedAt: string }>;
      nextCursor: string | null;
    }> => {
      return this.rpc<
        {
          items: Array<{ key: string; value: T; version: number; schemaVersion: number; updatedAt: string }>;
          nextCursor: string | null;
        },
        BridgeStorageListPayload
      >('ui:storage:list', { namespace, scope, ...options });
    }
  };

  public courses = {
    list: async (options: BridgeCoursesListPayload = {}): Promise<PluginCursorPage<PluginCourseMetadata>> => {
      return this.rpc<PluginCursorPage<PluginCourseMetadata>, BridgeCoursesListPayload>('courses:list', options);
    },
    get: async (id: string): Promise<PluginCourseMetadata> =>
      this.rpc<PluginCourseMetadata, BridgeIdPayload>('courses:get', { id }),
    getStructure: async (id: string): Promise<PluginCourseStructure> =>
      this.rpc<PluginCourseStructure, BridgeIdPayload>('courses:getStructure', { id })
  };

  public lessons = {
    list: async (
      options: BridgeListPayload & { courseId: string }
    ): Promise<PluginCursorPage<PluginLessonMetadata>> => {
      return this.rpc<PluginCursorPage<PluginLessonMetadata>, BridgeListPayload>('lessons:list', options);
    },
    get: async (id: string): Promise<PluginLessonMetadata> =>
      this.rpc<PluginLessonMetadata, BridgeIdPayload>('lessons:get', { id }),
    getContent: async (id: string): Promise<PluginLessonContent> =>
      this.rpc<PluginLessonContent, BridgeIdPayload>('lessons:getContent', { id })
  };

  public exercises = {
    list: async (
      options: BridgeListPayload & { courseId: string }
    ): Promise<PluginCursorPage<PluginExerciseMetadata>> => {
      return this.rpc<PluginCursorPage<PluginExerciseMetadata>, BridgeListPayload>('exercises:list', options);
    },
    get: async (id: string): Promise<PluginExerciseMetadata> =>
      this.rpc<PluginExerciseMetadata, BridgeIdPayload>('exercises:get', { id })
  };

  public progress = {
    getCurrent: async (resource: {
      type: 'lesson' | 'course';
      id: string;
    }): Promise<PluginLessonProgress | PluginCourseProgress> =>
      this.rpc(resource.type === 'lesson' ? 'progress:getLesson' : 'progress:getCourse', { id: resource.id }),
    setCompletion: async (lessonId: string, isComplete: boolean): Promise<PluginLessonProgress> =>
      this.rpc<PluginLessonProgress, BridgeProgressSetPayload>('progress:setCompletion', { lessonId, isComplete })
  };

  public certificates = {
    list: async (options: BridgeListPayload = {}): Promise<PluginCursorPage<PluginIssuedCertificate>> =>
      this.rpc('certificates:list', options),
    get: async (id: string): Promise<PluginIssuedCertificate> =>
      this.rpc<PluginIssuedCertificate, BridgeIdPayload>('certificates:get', { id })
  };

  public landingTemplates = {
    preview: async (templateId: string): Promise<void> => {
      await this.rpc<void, BridgeTemplateSelectionPayload>('landing.templates:preview', { templateId });
    },
    select: async (templateId: string): Promise<void> => {
      await this.rpc<void, BridgeTemplateSelectionPayload>('landing.templates:select', { templateId });
    }
  };

  public certificateTemplates = {
    list: async (): Promise<PluginCertificateTemplate[]> =>
      this.rpc<PluginCertificateTemplate[], Record<string, never>>('certificateTemplates:list', {}),
    getApplied: async (courseId: string): Promise<PluginAppliedCertificateTemplate> =>
      this.rpc<PluginAppliedCertificateTemplate, BridgeIdPayload>('certificateTemplates:getApplied', {
        id: courseId
      }),
    apply: async (payload: BridgeCertificateTemplateApplyPayload): Promise<void> => {
      await this.rpc<void, BridgeCertificateTemplateApplyPayload>('certificate.templates:apply', payload);
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
