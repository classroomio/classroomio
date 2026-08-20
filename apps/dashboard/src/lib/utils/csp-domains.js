// SaaS default CSP domains, baked in at build time.
// Self-hosted (adapter-node) starts with empty lists; runtime domains
// are added via env vars in hooks.server.ts so pre-built Docker images stay configurable.

const saasDefaults = {
  scriptSrc: [
    'https://assets.cdn.clsrio.com',
    'https://embed.classroomio.com',
    'https://cdnjs.cloudflare.com',
    'https://cdn.userjot.com',
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
    'https://docs.google.com',
    // Slide embed platforms — keep in sync with SLIDE_EMBED_FRAME_SRC_ORIGINS
    // in packages/utils/src/functions/slide-embed.ts
    'https://www.canva.com',
    'https://canva.com',
    'https://onedrive.live.com',
    'https://*.onedrive.live.com',
    'https://officeapps.live.com',
    'https://*.officeapps.live.com',
    'https://view.officeapps.live.com',
    'https://1drv.ms',
    'https://*.sharepoint.com',
    'https://www.icloud.com',
    'https://icloud.com',
    'https://embed.figma.com',
    'https://www.figma.com',
    'https://figma.com',
    'https://prezi.com',
    'https://www.prezi.com',
    'https://pitch.com',
    'https://www.pitch.com',
    'https://gamma.app',
    'https://www.gamma.app',
    'https://www.slideshare.net',
    'https://slideshare.net',
    'https://www.beautiful.ai',
    'https://beautiful.ai'
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
