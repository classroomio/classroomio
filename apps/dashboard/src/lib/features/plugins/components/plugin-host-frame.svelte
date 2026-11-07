<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { get } from 'svelte/store';
  import { cn } from '@cio/ui/tools';
  import { PLUGIN_SURFACE_CONTRACTS } from '@cio/utils/validation/plugin';
  import { PluginBridgeHost } from '@classroomio/plugin-sdk';
  import { resolveCurrentHostTheme } from '../utils/theme';
  import { snackbar } from '$features/ui/snackbar/store';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { classroomio, getRequestBaseUrl } from '$lib/utils/services/api';
  import type { PluginActionEvent, PluginResourceContext, PluginStorageScope } from '../utils/types';

  interface Props {
    installationId: string;
    pluginId: string;
    version: string;
    contributionId?: string;
    grantedScopes?: string[];
    organizationId?: string | null;
    srcDoc?: string;
    srcUrl?: string;
    className?: string;
    title?: string;
    target: string;
    resource?: PluginResourceContext;
    onAction?: (event: PluginActionEvent) => Promise<unknown> | unknown;
    onaction?: (event: PluginActionEvent) => Promise<unknown> | unknown;
  }

  let {
    installationId,
    pluginId,
    version,
    contributionId,
    grantedScopes = [],
    organizationId = null,
    srcDoc,
    srcUrl,
    className = 'w-full h-full border-0',
    title = 'Plugin Frame',
    target,
    resource,
    onAction,
    onaction
  }: Props = $props();

  const effectiveAction = $derived(onAction ?? onaction);

  let iframeElement = $state<HTMLIFrameElement | null>(null);
  let bridgeHost: PluginBridgeHost | null = null;
  let themeObserver: MutationObserver | null = null;
  let frameHeight = $state<number | null>(null);
  let isDirty = false;
  let isFrameLoading = $state(true);
  let hasFrameError = $state(false);

  const surfaceContract = $derived(
    target in PLUGIN_SURFACE_CONTRACTS
      ? PLUGIN_SURFACE_CONTRACTS[target as keyof typeof PLUGIN_SURFACE_CONTRACTS]
      : PLUGIN_SURFACE_CONTRACTS['plugin.page']
  );

  function getPreferenceStorageKey(namespace: string, key: string): string {
    const profileId = get(profile)?.id ?? 'anonymous';
    return `cio_plugin_preference_${profileId}_${installationId}_${namespace}_${key}`;
  }

  function requireOrganizationId(): string {
    if (!organizationId) {
      throw { code: 'FORBIDDEN', message: 'An organization context is required' };
    }

    return organizationId;
  }

  function requireGrantedScope(scope: string): void {
    if (!grantedScopes.includes(scope)) {
      throw { code: 'FORBIDDEN', message: `Plugin requires the ${scope} permission` };
    }
  }

  async function responseData<T>(response: Response): Promise<T> {
    let body: { success?: boolean; data?: T; message?: string; error?: string } | null = null;
    try {
      body = (await response.json()) as { success?: boolean; data?: T; message?: string; error?: string };
    } catch {
      body = null;
    }

    if (!response.ok || !body?.success) {
      const message = body?.message || body?.error || 'The requested plugin data could not be saved';
      const code =
        response.status === 403 ? 'FORBIDDEN' : response.status === 400 ? 'INVALID_PARAMS' : 'INTERNAL_ERROR';
      throw { code, message };
    }

    return body.data as T;
  }

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (!isDirty) return;

    event.preventDefault();
  }

  function handleFrameLoad() {
    if (!iframeElement || !bridgeHost) return;

    isFrameLoading = false;

    try {
      bridgeHost.startHandshake();
    } catch (error) {
      console.error('[PluginHostFrame] Failed to start bridge handshake:', error);
    }
  }

  function handleFrameError() {
    isFrameLoading = false;
    hasFrameError = true;
  }

  async function dispatchSurfaceAction(action: string, data: unknown) {
    if (!effectiveAction) {
      throw { code: 'NOT_SUPPORTED', message: `The ${target} surface does not support this operation` };
    }

    const actionDetail: PluginActionEvent = {
      installationId,
      pluginId,
      version,
      contributionId: contributionId ?? target,
      target,
      resource,
      action,
      data
    };
    const result = await effectiveAction(actionDetail);
    return result !== undefined ? result : { handled: true };
  }

  onMount(() => {
    if (!iframeElement) return;

    const currentTheme = resolveCurrentHostTheme();
    window.addEventListener('beforeunload', handleBeforeUnload);
    bridgeHost = new PluginBridgeHost({
      iframe: iframeElement,
      targetOrigin: '*',
      theme: currentTheme,
      context: {
        installationId,
        pluginId,
        version,
        capabilities: grantedScopes,
        locale: document.documentElement.lang || navigator.language || 'en',
        actor: { role: $currentOrg.roleId === 1 ? 'admin' : $currentOrg.roleId === 2 ? 'tutor' : 'learner' },
        organization: $currentOrg?.id
          ? {
              id: $currentOrg.id,
              name: $currentOrg.name ?? '',
              avatarUrl: $currentOrg.avatarUrl ?? null
            }
          : undefined,
        surface: { target, resource }
      },
      handlers: {
        onToast: async (payload) => {
          const variant = payload.variant ?? 'info';
          if (variant === 'success') {
            snackbar.success(payload.message);
          } else if (variant === 'error') {
            snackbar.error(payload.message);
          } else {
            snackbar.info(payload.message);
          }
        },
        onResize: async ({ height }) => {
          if (!Number.isFinite(height)) return;

          frameHeight = Math.min(surfaceContract.maxHeight, Math.max(surfaceContract.minHeight, Math.ceil(height)));
        },
        onNavigate: async ({ href }) => {
          if (!href.startsWith('/') || href.startsWith('//')) {
            throw { code: 'INVALID_PARAMS', message: 'Plugins may only navigate to a host-relative path' };
          }
          const resolvedHref =
            href.startsWith('/org/plugins/') && $currentOrg?.siteName
              ? `/org/${$currentOrg.siteName}/plugins/${href.slice('/org/plugins/'.length)}`
              : href;
          await goto(resolve(resolvedHref, {}));
        },
        onSetDirty: async ({ dirty }) => {
          isDirty = dirty;
        },
        onPreferenceGet: async ({ key, namespace }) => {
          const storageKey = getPreferenceStorageKey(namespace || 'default', key);
          try {
            const raw = localStorage.getItem(storageKey);
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        },
        onPreferenceSet: async ({ key, value, namespace }) => {
          const storageKey = getPreferenceStorageKey(namespace || 'default', key);
          localStorage.setItem(storageKey, JSON.stringify(value));
        },
        onPreferenceDelete: async ({ key, namespace }) => {
          const storageKey = getPreferenceStorageKey(namespace || 'default', key);
          localStorage.removeItem(storageKey);
          return true;
        },
        onLandingTemplatePreview: async ({ templateId }) => {
          return dispatchSurfaceAction('preview', { templateId });
        },
        onLandingTemplateSelect: async ({ templateId }) => {
          return dispatchSurfaceAction('select', { templateId });
        },
        onCertificateTemplateApply: async ({ templateId, document, name }) => {
          requireGrantedScope('certificate.template:write');
          return dispatchSurfaceAction('apply', { id: templateId, document, name });
        },
        onStorageGet: async ({ key, namespace, scope }) => {
          const orgId = requireOrganizationId();
          const targetScope: PluginStorageScope = scope ?? 'organization';
          const queryParams: { scope: PluginStorageScope; resourceId?: string; resourceType?: string } = {
            scope: targetScope
          };
          if (targetScope === 'resource' && resource?.id) {
            queryParams.resourceId = resource.id;
            queryParams.resourceType = resource.type;
          }
          const response = await classroomio.plugins.installations[':installationId'].storage[':namespace'][
            ':key'
          ].$get(
            {
              param: { installationId, namespace: namespace ?? 'default', key },
              query: queryParams
            },
            { headers: { 'cio-org-id': orgId } }
          );
          return responseData(response);
        },
        onStorageGetRecord: async ({ key, namespace, scope }) => {
          const orgId = requireOrganizationId();
          const targetScope: PluginStorageScope = scope ?? 'organization';
          const query = new URLSearchParams({ scope: targetScope });
          if (targetScope === 'resource' && resource?.id) {
            query.set('resourceId', resource.id);
            query.set('resourceType', resource.type);
          }
          const response = await fetch(
            `${getRequestBaseUrl()}/plugins/installations/${installationId}/storage-record/${encodeURIComponent(namespace ?? 'default')}/${encodeURIComponent(key)}?${query.toString()}`,
            { credentials: 'include', headers: { 'cio-org-id': orgId } }
          );

          return responseData(response);
        },
        onStorageSet: async ({ key, value, namespace, scope, schemaVersion, expectedVersion }) => {
          const orgId = requireOrganizationId();
          const targetScope: PluginStorageScope = scope ?? 'organization';
          const jsonPayload: {
            value: unknown;
            scope: PluginStorageScope;
            resourceId?: string;
            resourceType?: string;
            schemaVersion: number;
            expectedVersion?: number;
          } = { value, scope: targetScope, schemaVersion: schemaVersion ?? 1, expectedVersion };
          if (targetScope === 'resource' && resource?.id) {
            jsonPayload.resourceId = resource.id;
            jsonPayload.resourceType = resource.type;
          }
          const response = await classroomio.plugins.installations[':installationId'].storage[':namespace'][
            ':key'
          ].$put(
            {
              param: { installationId, namespace: namespace ?? 'default', key },
              json: jsonPayload
            },
            { headers: { 'cio-org-id': orgId } }
          );
          return responseData(response);
        },
        onStorageDelete: async ({ key, namespace, scope }) => {
          const orgId = requireOrganizationId();
          const targetScope: PluginStorageScope = scope ?? 'organization';
          const queryParams: { scope: PluginStorageScope; resourceId?: string; resourceType?: string } = {
            scope: targetScope
          };
          if (targetScope === 'resource' && resource?.id) {
            queryParams.resourceId = resource.id;
            queryParams.resourceType = resource.type;
          }
          const response = await classroomio.plugins.installations[':installationId'].storage[':namespace'][
            ':key'
          ].$delete(
            {
              param: { installationId, namespace: namespace ?? 'default', key },
              query: queryParams
            },
            { headers: { 'cio-org-id': orgId } }
          );
          const result = await responseData<{ success: boolean; deleted: boolean }>(response);
          return result.deleted;
        },
        onStorageList: async ({ namespace, scope, cursor, limit }) => {
          const orgId = requireOrganizationId();
          const targetScope: PluginStorageScope = scope ?? 'organization';
          const queryParams: {
            scope: PluginStorageScope;
            resourceId?: string;
            resourceType?: string;
            cursor?: string;
            limit?: string;
          } = {
            scope: targetScope,
            cursor,
            limit: limit === undefined ? undefined : String(limit)
          };
          if (targetScope === 'resource' && resource?.id) {
            queryParams.resourceId = resource.id;
            queryParams.resourceType = resource.type;
          }
          const response = await classroomio.plugins.installations[':installationId'].storage[':namespace'].$get(
            {
              param: { installationId, namespace: namespace ?? 'default' },
              query: queryParams
            },
            { headers: { 'cio-org-id': orgId } }
          );
          return responseData(response);
        },
        onDataRequest: async (action, payload) => {
          const orgId = requireOrganizationId();
          const id = typeof payload.id === 'string' ? payload.id : '';
          const routeByAction: Record<string, { path: string; method?: 'GET' | 'PUT'; body?: unknown }> = {
            'identity:getCurrent': { path: 'identity' },
            'organization:getProfile': { path: 'organization' },
            'courses:get': { path: `courses/${encodeURIComponent(id)}` },
            'courses:getStructure': { path: `courses/${encodeURIComponent(id)}/structure` },
            'lessons:get': { path: `lessons/${encodeURIComponent(id)}` },
            'lessons:getContent': { path: `lessons/${encodeURIComponent(id)}/content` },
            'exercises:get': { path: `exercises/${encodeURIComponent(id)}` },
            'progress:getLesson': { path: `progress/lessons/${encodeURIComponent(id)}` },
            'progress:getCourse': { path: `progress/courses/${encodeURIComponent(id)}` },
            'progress:setCompletion': {
              path: `progress/lessons/${encodeURIComponent(String(payload.lessonId ?? ''))}`,
              method: 'PUT',
              body: { isComplete: payload.isComplete }
            },
            'certificates:get': { path: `certificates/${encodeURIComponent(id)}` },
            'certificateTemplates:list': { path: 'certificate-templates' },
            'certificateTemplates:getApplied': {
              path: `certificate-templates/applied/${encodeURIComponent(id)}`
            }
          };
          if (action === 'courses:list' || action === 'lessons:list' || action === 'exercises:list') {
            const query = new URLSearchParams();
            if (typeof payload.cursor === 'string') query.set('cursor', payload.cursor);
            if (typeof payload.limit === 'number') query.set('limit', String(payload.limit));
            if (typeof payload.courseId === 'string') query.set('courseId', payload.courseId);
            if (typeof payload.lessonId === 'string') query.set('lessonId', payload.lessonId);
            if (typeof payload.publishedOnly === 'boolean') {
              query.set('publishedOnly', String(payload.publishedOnly));
            }
            const resourceName = action.slice(0, action.indexOf(':'));
            routeByAction[action] = { path: `${resourceName}?${query.toString()}` };
          }
          if (action === 'certificates:list') {
            const query = new URLSearchParams();
            if (typeof payload.cursor === 'string') query.set('cursor', payload.cursor);
            if (typeof payload.limit === 'number') query.set('limit', String(payload.limit));
            if (typeof payload.courseId === 'string') query.set('courseId', payload.courseId);
            routeByAction[action] = { path: `certificates?${query.toString()}` };
          }
          const request = routeByAction[action];
          if (!request) throw { code: 'NOT_SUPPORTED', message: `Unsupported hosted data action: ${action}` };
          const response = await fetch(
            `${getRequestBaseUrl()}/plugins/installations/${installationId}/data/${request.path}`,
            {
              method: request.method ?? 'GET',
              credentials: 'include',
              headers: {
                'cio-org-id': orgId,
                ...(request.body ? { 'Content-Type': 'application/json' } : {})
              },
              body: request.body ? JSON.stringify(request.body) : undefined
            }
          );

          return responseData(response);
        }
      }
    });

    if (typeof document !== 'undefined') {
      themeObserver = new MutationObserver(() => {
        const updatedTheme = resolveCurrentHostTheme();
        bridgeHost?.setTheme(updatedTheme);
      });
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
    if (themeObserver) {
      themeObserver.disconnect();
      themeObserver = null;
    }

    if (bridgeHost) {
      bridgeHost.destroy();
      bridgeHost = null;
    }
  });
</script>

<div
  class={cn('relative w-full', (target === 'plugin.page' || className?.includes('h-full')) && 'h-full flex-1')}
  aria-busy={isFrameLoading}
>
  {#if isFrameLoading}
    <div class="ui:bg-muted/30 absolute inset-0" aria-label={title}></div>
  {/if}
  {#if hasFrameError}
    <div class="ui:text-muted-foreground flex min-h-20 items-center justify-center" role="alert">{title}</div>
  {:else}
    <iframe
      bind:this={iframeElement}
      onload={handleFrameLoad}
      onerror={handleFrameError}
      src={srcUrl}
      srcdoc={srcDoc}
      {title}
      class={className}
      style:height={frameHeight !== null && !className?.includes('h-full') ? `${frameHeight}px` : undefined}
      sandbox="allow-scripts allow-forms"
      referrerpolicy="no-referrer"
      allow="clipboard-write 'none'; camera 'none'; microphone 'none'; geolocation 'none'"
    ></iframe>
  {/if}
</div>
