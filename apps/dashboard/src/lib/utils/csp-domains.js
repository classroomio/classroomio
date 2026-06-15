// SaaS default CSP domains, baked in at build time.
// Self-hosted (adapter-node) starts with empty lists; runtime domains
// are added via env vars in hooks.server.ts so pre-built Docker images stay configurable.

const saasDefaults = {
  scriptSrc: [
    'https://assets.cdn.clsrio.com',
    'https://embed.classroomio.com',
    'https://cdnjs.cloudflare.com',
    'https://*.posthog.com',
    'https://*.senja.io',
    'https://umami.hz.oncws.com',
    'https://www.youtube.com',
    'https://youtube.com',
    'https://google.com',
    'https://apis.google.com',
    'https://accounts.google.com'
  ],
  styleSrc: [
    'https://cdn.plyr.io',
    'https://unpkg.com/katex@0.12.0/dist/katex.min.css',
    'https://assets.cdn.clsrio.com/eqneditor_1.css',
    'https://fonts.googleapis.com'
  ],
  connectSrc: [
    'https://*.classroomio.com',
    'https://classroomio.com',
    'https://app.classroomio.com',
    'https://api.classroomio.com',
    'https://pgrest.classroomio.com',
    'https://play.classroomio.com',
    'wss://*.classroomio.com',
    'https://assets.cdn.clsrio.com',
    'https://cdn.plyr.io',
    'https://*.posthog.com',
    'https://umami.hz.oncws.com',
    'https://*.r2.cloudflarestorage.com',
    'https://*.senja.io',
    'https://*.ytimg.com',
    'https://noembed.com',
    'https://www.googleapis.com',
    'https://o476906.ingest.us.sentry.io'
  ],
  frameSrc: [
    'https://www.youtube.com',
    'https://youtube.com',
    'https://www.youtube-nocookie.com',
    'https://www.google.com',
    'https://google.com',
    'https://drive.google.com',
    'https://docs.google.com'
  ],
  fontSrc: ['https://fonts.gstatic.com', 'https://cdn.plyr.io'],
  mediaSrc: ['https:']
};

/**
 * @param {boolean} isSelfHosted
 * @param {string | undefined} serverUrl - PUBLIC_SERVER_URL, added to connect-src for SaaS builds
 */
export function getCspDomains(isSelfHosted, serverUrl) {
  if (isSelfHosted) {
    return {
      scriptSrc: [],
      styleSrc: [],
      connectSrc: [],
      frameSrc: [],
      fontSrc: [],
      mediaSrc: [],
      apiOrigin: null
    };
  }

  return {
    ...saasDefaults,
    apiOrigin: serverUrl ?? null
  };
}
