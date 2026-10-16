const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  xhtml: 'application/xhtml+xml; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  vtt: 'text/vtt; charset=utf-8',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  ico: 'image/x-icon',
  bmp: 'image/bmp',
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  oga: 'audio/ogg',
  m4a: 'audio/mp4',
  pdf: 'application/pdf',
  zip: 'application/zip',
  swf: 'application/x-shockwave-flash',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject'
};

/**
 * Resolves the content type stored at extraction time from a file name.
 * Unknown extensions fall back to bytes so `nosniff` never blocks a known
 * script or style served with the wrong type.
 */
export function contentTypeForFile(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';

  return EXTENSION_CONTENT_TYPES[extension] ?? 'application/octet-stream';
}
