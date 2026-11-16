import { describe, expect, it } from 'vitest';
import { resolvePluginFrameSecurity } from './frame-security';

describe('resolvePluginFrameSecurity', () => {
  it('allows the configured plugin asset origin', () => {
    const security = resolvePluginFrameSecurity({
      srcUrl: 'https://plugins.example.com/com.classroomio.code-runner/1.0.0/digest/question.html',
      configuredPluginAssetOrigin: 'https://plugins.example.com',
      isSelfHosted: true
    });

    expect(security).toEqual({
      allowSameOrigin: true,
      sandbox: 'allow-scripts allow-forms allow-same-origin',
      targetOrigin: 'https://plugins.example.com'
    });
  });

  it('uses the ClassroomIO plugin origin for SaaS deployments', () => {
    const security = resolvePluginFrameSecurity({
      srcUrl: 'https://plugins.classroomio.com/com.classroomio.code-runner/1.0.0/digest/question.html',
      isSelfHosted: false
    });

    expect(security.allowSameOrigin).toBe(true);
    expect(security.targetOrigin).toBe('https://plugins.classroomio.com');
  });

  it('keeps foreign plugin URLs opaque', () => {
    const security = resolvePluginFrameSecurity({
      srcUrl: 'https://untrusted.example.com/question.html',
      configuredPluginAssetOrigin: 'https://plugins.example.com',
      isSelfHosted: true
    });

    expect(security).toEqual({
      allowSameOrigin: false,
      sandbox: 'allow-scripts allow-forms',
      targetOrigin: '*'
    });
  });

  it('keeps srcdoc frames opaque even when srcUrl is trusted', () => {
    const security = resolvePluginFrameSecurity({
      srcUrl: 'https://plugins.example.com/question.html',
      srcDoc: '<!doctype html><title>Inline plugin</title>',
      configuredPluginAssetOrigin: 'https://plugins.example.com',
      isSelfHosted: true
    });

    expect(security.allowSameOrigin).toBe(false);
    expect(security.targetOrigin).toBe('*');
  });

  it('keeps self-hosted frames opaque without an explicit plugin origin', () => {
    const security = resolvePluginFrameSecurity({
      srcUrl: 'https://plugins.example.com/question.html',
      isSelfHosted: true
    });

    expect(security.allowSameOrigin).toBe(false);
  });

  it('rejects non-http plugin URLs', () => {
    const security = resolvePluginFrameSecurity({
      srcUrl: 'data:text/html,<title>Plugin</title>',
      configuredPluginAssetOrigin: 'data:text/html,plugin',
      isSelfHosted: true
    });

    expect(security.allowSameOrigin).toBe(false);
  });

  it('allows the local development API server origin when in dev mode', () => {
    const security = resolvePluginFrameSecurity({
      srcUrl: 'http://localhost:3002/plugins/assets/com.classroomio.code-runner/1.0.0/digest/question.html',
      isSelfHosted: false,
      serverOrigin: 'http://localhost:3002',
      isDev: true,
      currentOrigin: 'http://localhost:5173'
    });

    expect(security).toEqual({
      allowSameOrigin: true,
      sandbox: 'allow-scripts allow-forms allow-same-origin',
      targetOrigin: 'http://localhost:3002'
    });
  });

  it('never grants allow-same-origin when frame origin matches the host origin (sandbox escape guard)', () => {
    const security = resolvePluginFrameSecurity({
      srcUrl: 'https://learn.company.com/plugins/question.html',
      configuredPluginAssetOrigin: 'https://learn.company.com',
      isSelfHosted: true,
      currentOrigin: 'https://learn.company.com'
    });

    expect(security).toEqual({
      allowSameOrigin: false,
      sandbox: 'allow-scripts allow-forms',
      targetOrigin: '*'
    });
  });
});
