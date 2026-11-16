const SAAS_PLUGIN_ASSET_ORIGIN = 'https://plugins.classroomio.com';

export interface PluginFrameSecurityOptions {
  srcUrl?: string;
  srcDoc?: string;
  configuredPluginAssetOrigin?: string;
  isSelfHosted: boolean;
  serverOrigin?: string;
  isDev?: boolean;
  currentOrigin?: string;
}

export interface PluginFrameSecurity {
  allowSameOrigin: boolean;
  sandbox: string;
  targetOrigin: string;
}

export function parseHttpOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

    return url.origin;
  } catch {
    return null;
  }
}

export function resolvePluginFrameSecurity({
  srcUrl,
  srcDoc,
  configuredPluginAssetOrigin,
  isSelfHosted,
  serverOrigin,
  isDev = false,
  currentOrigin
}: PluginFrameSecurityOptions): PluginFrameSecurity {
  const opaqueFrameSecurity: PluginFrameSecurity = {
    allowSameOrigin: false,
    sandbox: 'allow-scripts allow-forms',
    targetOrigin: '*'
  };

  if (!srcUrl || srcDoc) return opaqueFrameSecurity;

  const frameOrigin = parseHttpOrigin(srcUrl);
  if (!frameOrigin) return opaqueFrameSecurity;

  // Sandbox Escape Guard: never grant same-origin access if the frame shares the host origin
  const parsedHostOrigin = currentOrigin ? parseHttpOrigin(currentOrigin) : null;
  if (parsedHostOrigin && frameOrigin === parsedHostOrigin) {
    return opaqueFrameSecurity;
  }

  const localDevOrigin = isDev && serverOrigin ? parseHttpOrigin(serverOrigin) : null;
  const fallbackOrigin = localDevOrigin || (isSelfHosted ? '' : SAAS_PLUGIN_ASSET_ORIGIN);
  const expectedOriginValue = configuredPluginAssetOrigin || fallbackOrigin;
  const expectedOrigin = parseHttpOrigin(expectedOriginValue);
  if (!expectedOrigin || frameOrigin !== expectedOrigin) return opaqueFrameSecurity;

  return {
    allowSameOrigin: true,
    sandbox: 'allow-scripts allow-forms allow-same-origin',
    targetOrigin: frameOrigin
  };
}
