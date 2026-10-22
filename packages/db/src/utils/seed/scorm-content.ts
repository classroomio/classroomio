import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import JSZip from 'jszip';

export interface SeedScormStorage {
  bucket: string;
  client: S3Client;
}

interface ProvisionedPackage {
  zipBytes: number;
  extractedBytes: number;
  fileCount: number;
}

function resolveStorageEndpoint(): {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
} | null {
  const endpoint = process.env.OBJECT_STORAGE_ENDPOINT;
  const accessKeyId = process.env.OBJECT_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY;

  if (endpoint && accessKeyId && secretAccessKey) {
    return {
      endpoint,
      region: process.env.OBJECT_STORAGE_REGION || 'us-east-1',
      accessKeyId,
      secretAccessKey,
      forcePathStyle:
        process.env.OBJECT_STORAGE_FORCE_PATH_STYLE === 'true' || process.env.OBJECT_STORAGE_FORCE_PATH_STYLE === '1'
    };
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const cloudflareAccessKey = process.env.CLOUDFLARE_ACCESS_KEY;
  const cloudflareSecret = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;

  if (accountId && cloudflareAccessKey && cloudflareSecret) {
    return {
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      region: 'auto',
      accessKeyId: cloudflareAccessKey,
      secretAccessKey: cloudflareSecret,
      forcePathStyle: false
    };
  }

  return null;
}

/** Returns null when object storage is not configured, so the seed can skip cleanly. */
export function resolveSeedScormStorage(): SeedScormStorage | null {
  const config = resolveStorageEndpoint();

  if (!config) return null;

  return {
    bucket: process.env.OBJECT_STORAGE_BUCKET_SCORM || 'scorm',
    client: new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      forcePathStyle: config.forcePathStyle
    })
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildScoHtml(title: string): string {
  const safeTitle = escapeHtml(title);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; color: #111827; }
      main { max-width: 36rem; margin: 0 auto; }
      button { margin-top: 1rem; padding: 0.6rem 1rem; font: inherit; cursor: pointer; }
    </style>
  </head>
  <body>
    <main>
      <h1>${safeTitle}</h1>
      <p>This seeded module is ready to launch and report completion.</p>
      <button id="complete" type="button">Mark complete</button>
      <p id="status" role="status"></p>
    </main>
    <script>
      (function () {
        function findApi(win) {
          var attempts = 0;
          while (win && !win.API_1484_11 && win.parent && win.parent !== win && attempts < 20) {
            win = win.parent;
            attempts += 1;
          }
          return win && win.API_1484_11 ? win.API_1484_11 : null;
        }

        var api = findApi(window);
        var status = document.getElementById('status');

        if (!api) {
          status.textContent = 'SCORM API not found.';
          return;
        }

        api.Initialize('');
        document.getElementById('complete').addEventListener('click', function () {
          api.SetValue('cmi.completion_status', 'completed');
          api.SetValue('cmi.success_status', 'passed');
          api.Commit('');
          status.textContent = 'Module marked complete.';
        });
      })();
    </script>
  </body>
</html>`;
}

function buildManifest(title: string, modules: string[]): string {
  const items = modules
    .map(
      (moduleTitle, index) =>
        `      <item identifier="ITEM-${index + 1}" identifierref="RES-${index + 1}">
        <title>${escapeHtml(moduleTitle)}</title>
      </item>`
    )
    .join('\n');
  const resources = modules
    .map(
      (_moduleTitle, index) =>
        `    <resource identifier="RES-${index + 1}" type="webcontent" adlcp:scormType="sco" href="sco-${index + 1}.html">
      <file href="sco-${index + 1}.html" />
    </resource>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="CIO-SEED" version="1"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>
  <organizations default="ORG-1">
    <organization identifier="ORG-1">
      <title>${escapeHtml(title)}</title>
${items}
    </organization>
  </organizations>
  <resources>
${resources}
  </resources>
</manifest>`;
}

async function putObject(storage: SeedScormStorage, key: string, body: Buffer | string, contentType: string) {
  await storage.client.send(
    new PutObjectCommand({ Bucket: storage.bucket, Key: key, Body: body, ContentType: contentType })
  );
}

/**
 * Generates and uploads a self-contained SCORM 2004 package so a freshly
 * seeded demo can launch without a separate manual upload step.
 */
export async function provisionSeedScormPackage(
  storage: SeedScormStorage,
  contentPrefix: string,
  uploadKey: string,
  title: string,
  modules: string[]
): Promise<ProvisionedPackage> {
  const zip = new JSZip();
  const manifest = buildManifest(title, modules);
  let extractedBytes = Buffer.byteLength(manifest);

  zip.file('imsmanifest.xml', manifest);
  await putObject(storage, `${contentPrefix}/imsmanifest.xml`, manifest, 'application/xml; charset=utf-8');

  for (const [index, moduleTitle] of modules.entries()) {
    const href = `sco-${index + 1}.html`;
    const html = buildScoHtml(moduleTitle);

    extractedBytes += Buffer.byteLength(html);
    zip.file(href, html);
    await putObject(storage, `${contentPrefix}/${href}`, html, 'text/html; charset=utf-8');
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  await putObject(storage, uploadKey, zipBuffer, 'application/zip');

  return {
    zipBytes: zipBuffer.length,
    extractedBytes,
    fileCount: modules.length + 1
  };
}
