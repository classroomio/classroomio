<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { PluginBridgeHost } from '@classroomio/plugin-sdk';
  import { pluginsApi } from '../api/plugins.svelte';
  import { resolveCurrentHostTheme } from '../utils/theme';
  import { snackbar } from '$features/ui/snackbar/store';

  interface Props {
    installationId: string;
    pluginId: string;
    version: string;
    organizationId?: string | null;
    orgSlug?: string;
    srcDoc?: string;
    srcUrl?: string;
    className?: string;
    title?: string;
  }

  let {
    installationId,
    pluginId,
    version,
    organizationId = null,
    orgSlug,
    srcDoc,
    srcUrl,
    className = 'w-full h-full border-0',
    title = 'Plugin Frame'
  }: Props = $props();

  let iframeElement = $state<HTMLIFrameElement | null>(null);
  let bridgeHost: PluginBridgeHost | null = null;
  let themeObserver: MutationObserver | null = null;

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

    bridgeHost = new PluginBridgeHost({
      iframe: iframeElement,
      targetOrigin: '*',
      theme: currentTheme,
      context: {
        installationId,
        pluginId,
        version,
        organizationId,
        userId: null,
        orgSlug
      },
      handlers: {
        onStorageGet: async (namespace, key) => {
          return pluginsApi.getStorage(installationId, namespace, key);
        },
        onStorageSet: async (namespace, key, value) => {
          await pluginsApi.setStorage(installationId, namespace, key, value);
        },
        onStorageDelete: async (namespace, key) => {
          return pluginsApi.deleteStorage(installationId, namespace, key);
        },
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
        onRequestLaunchCode: async (payload) => {
          const result = await pluginsApi.requestLaunchCode(
            installationId,
            organizationId ?? undefined,
            payload.target
          );
          if (!result) {
            throw { code: 'INTERNAL_ERROR', message: 'Failed to mint launch code' };
          }
          return result;
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
  sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
></iframe>
