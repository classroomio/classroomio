<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { PluginBridgeHost } from '@classroomio/plugin-sdk';
  import { resolveCurrentHostTheme } from '../utils/theme';
  import { snackbar } from '$features/ui/snackbar/store';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';

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
    resource
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
        surface: { target }
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
