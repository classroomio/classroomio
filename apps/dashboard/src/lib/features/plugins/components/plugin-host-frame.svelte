<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { PluginBridgeHost } from '@classroomio/plugin-sdk';
  import { resolveCurrentHostTheme } from '../utils/theme';
  import { snackbar } from '$features/ui/snackbar/store';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { classroomio } from '$lib/utils/services/api';

  export interface PluginActionEvent {
    installationId: string;
    pluginId: string;
    version: string;
    target: string;
    resource?: {
      type: 'lesson' | 'course' | 'certificate' | 'organization';
      id: string;
    };
    action: string;
    data?: unknown;
  }

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
    resource?: {
      type: 'lesson' | 'course' | 'certificate' | 'organization';
      id: string;
    };
    onAction?: (event: PluginActionEvent) => Promise<void> | void;
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
    if (!response.ok) {
      throw { code: 'INTERNAL_ERROR', message: 'The requested plugin data could not be saved' };
    }

    const body = (await response.json()) as { success?: boolean; data?: T };
    if (!body.success) {
      throw { code: 'INTERNAL_ERROR', message: 'The requested plugin data could not be saved' };
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
              name: $currentOrg.name,
              avatarUrl: $currentOrg.avatar_url ?? null
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
          window.location.assign(href);
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

          if (!onAction) {
            throw {
              code: 'NOT_SUPPORTED',
              message: `Host action "${payload.action}" is not supported in this surface context`
            };
          }

          await onAction(actionDetail);
          return { handled: true };
        },
        onStorageGet: async ({ key, namespace, scope }) => {
          const orgId = requireOrganizationId();
          const targetScope = scope ?? 'organization';
          const queryParams: Record<string, string> = { scope: targetScope };
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
          const targetScope = scope ?? 'organization';
          const jsonPayload: Record<string, unknown> = { value, scope: targetScope };
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
          const targetScope = scope ?? 'organization';
          const queryParams: Record<string, string> = { scope: targetScope };
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
          const targetScope = scope ?? 'organization';
          const queryParams: Record<string, string> = { scope: targetScope };
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
