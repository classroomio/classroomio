<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { get } from 'svelte/store';
  import { PluginBridgeHost } from '@classroomio/plugin-sdk';
  import { resolveCurrentHostTheme } from '../utils/theme';
  import { snackbar } from '$features/ui/snackbar/store';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { classroomio } from '$lib/utils/services/api';
  import type { PluginActionEvent, PluginResourceContext, PluginStorageScope } from '../utils/types';

  interface Props {
    installationId: string;
    pluginId: string;
    version: string;
    organizationId?: string | null;
    srcDoc?: string;
    srcUrl?: string;
    className?: string;
    title?: string;
    target: string;
    backendAudience?: string;
    resource?: PluginResourceContext;
    onAction?: (event: PluginActionEvent) => Promise<unknown> | unknown;
  }

  let {
    installationId,
    pluginId,
    version,
    organizationId = null,
    srcDoc,
    srcUrl,
    className = 'w-full h-full border-0',
    title = 'Plugin Frame',
    target,
    backendAudience,
    resource,
    onAction
  }: Props = $props();

  let iframeElement = $state<HTMLIFrameElement | null>(null);
  let bridgeHost: PluginBridgeHost | null = null;
  let themeObserver: MutationObserver | null = null;
  let frameHeight = $state<number | null>(null);
  let isDirty = false;

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

    try {
      bridgeHost.startHandshake();
    } catch (error) {
      console.error('[PluginHostFrame] Failed to start bridge handshake:', error);
    }
  }

  onMount(() => {
    if (!iframeElement) return;

    const currentTheme = resolveCurrentHostTheme();
    window.addEventListener('beforeunload', handleBeforeUnload);
    bridgeHost = new PluginBridgeHost({
      iframe: iframeElement,
      // Custom plugin frames intentionally have an opaque sandbox origin. The
      // transferred MessagePort and handshake nonce authenticate the channel.
      targetOrigin: '*',
      theme: currentTheme,
      context: {
        installationId,
        pluginId,
        version,
        backendAudience,
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

          frameHeight = Math.min(4000, Math.max(0, Math.ceil(height)));
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
        onAction: async (payload) => {
          const actionDetail: PluginActionEvent = {
            installationId,
            pluginId,
            version,
            target,
            resource,
            action: payload.action,
            data: payload.data
          };

          if (onAction) {
            const result = await onAction(actionDetail);
            return result !== undefined ? result : { handled: true };
          }

          if (payload.action === 'courses:list') {
            const orgId = requireOrganizationId();
            const rawData =
              payload.data && typeof payload.data === 'object' ? (payload.data as Record<string, unknown>) : {};
            const queryParams: { cursor?: string; limit?: string; publishedOnly?: string } = {};
            if (typeof rawData.cursor === 'string') queryParams.cursor = rawData.cursor;
            if (typeof rawData.limit === 'number') queryParams.limit = String(rawData.limit);
            if (typeof rawData.publishedOnly === 'boolean') queryParams.publishedOnly = String(rawData.publishedOnly);

            const response = await classroomio.plugins.installations[':installationId'].courses.$get(
              { param: { installationId }, query: queryParams },
              { headers: { 'cio-org-id': orgId } }
            );
            return responseData(response);
          }

          if (payload.action === 'lessons:list') {
            const orgId = requireOrganizationId();
            const rawData =
              payload.data && typeof payload.data === 'object' ? (payload.data as Record<string, unknown>) : {};
            const queryParams: { courseId?: string } = {};
            if (typeof rawData.courseId === 'string') {
              queryParams.courseId = rawData.courseId;
            } else if (resource?.type === 'course' && resource.id) {
              queryParams.courseId = resource.id;
            }

            const response = await classroomio.plugins.installations[':installationId'].lessons.$get(
              {
                param: { installationId },
                query: queryParams
              },
              { headers: { 'cio-org-id': orgId } }
            );
            return responseData(response);
          }

          if (payload.action === 'exercises:list') {
            const orgId = requireOrganizationId();
            const rawData =
              payload.data && typeof payload.data === 'object' ? (payload.data as Record<string, unknown>) : {};
            const queryParams: { courseId?: string } = {};
            if (typeof rawData.courseId === 'string') {
              queryParams.courseId = rawData.courseId;
            } else if (resource?.type === 'course' && resource.id) {
              queryParams.courseId = resource.id;
            }

            const response = await classroomio.plugins.installations[':installationId'].exercises.$get(
              {
                param: { installationId },
                query: queryParams
              },
              { headers: { 'cio-org-id': orgId } }
            );
            return responseData(response);
          }

          throw {
            code: 'NOT_SUPPORTED',
            message: `Host action "${payload.action}" is not supported in this surface context`
          };
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
        onStorageSet: async ({ key, value, namespace, scope }) => {
          const orgId = requireOrganizationId();
          const targetScope: PluginStorageScope = scope ?? 'organization';
          const jsonPayload: {
            value: unknown;
            scope: PluginStorageScope;
            resourceId?: string;
            resourceType?: string;
          } = { value, scope: targetScope };
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
          await responseData(response);
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
        onStorageList: async ({ namespace, scope }) => {
          const orgId = requireOrganizationId();
          const targetScope: PluginStorageScope = scope ?? 'organization';
          const queryParams: { scope: PluginStorageScope; resourceId?: string; resourceType?: string } = {
            scope: targetScope
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

<iframe
  bind:this={iframeElement}
  onload={handleFrameLoad}
  src={srcUrl}
  srcdoc={srcDoc}
  {title}
  class={className}
  style:height={frameHeight !== null ? `${frameHeight}px` : undefined}
  sandbox="allow-scripts allow-forms"
  referrerpolicy="no-referrer"
  allow="clipboard-write 'none'; camera 'none'; microphone 'none'; geolocation 'none'"
></iframe>
