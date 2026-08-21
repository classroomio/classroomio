import { CLOUDFLARE } from '@api/constants';

export type RenderViewport = {
  width: number;
  height: number;
  deviceScaleFactor?: number;
};

export type PdfPageOptions = {
  width?: string;
  height?: string;
  landscape?: boolean;
  printBackground?: boolean;
  preferCSSPageSize?: boolean;
  margin?: { top?: string; right?: string; bottom?: string; left?: string };
};

const DEFAULT_VIEWPORT: RenderViewport = { width: 1100, height: 780 };

const DEFAULT_SCREENSHOT_OPTIONS = {
  type: 'png',
  omitBackground: false,
  fullPage: false
};

const DEFAULT_PDF_OPTIONS: PdfPageOptions = {
  width: '1100px',
  height: '780px',
  landscape: true,
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
};

const FONTS_READY_CLASS = 'fonts-ready';
const FONTS_READY_SELECTOR = `.${FONTS_READY_CLASS}`;

interface CloudflareRenderPayload {
  html: string;
  styles?: string;
  viewport?: RenderViewport;
  pdfOptions?: PdfPageOptions;
  screenshotOptions?: { type: 'png'; omitBackground?: boolean; fullPage?: boolean };
}

async function renderCloudflareBrowserDocument(
  endpoint: 'pdf' | 'screenshot',
  options: CloudflareRenderPayload
): Promise<Buffer> {
  let label;

  try {
    const requestBody: Record<string, unknown> = {
      html: options.html,
      addStyleTag: options.styles ? [{ content: options.styles }] : undefined,
      waitForSelector: options.html.includes(FONTS_READY_CLASS)
        ? { selector: FONTS_READY_SELECTOR, timeout: 10000 }
        : undefined,
      gotoOptions: {
        waitUntil: 'networkidle0',
        timeout: 30000
      },
      actionTimeout: 30000,
      viewport: {
        width: options.viewport?.width ?? DEFAULT_VIEWPORT.width,
        height: options.viewport?.height ?? DEFAULT_VIEWPORT.height,
        deviceScaleFactor: options.viewport?.deviceScaleFactor ?? (endpoint === 'screenshot' ? 2 : 1)
      }
    };

    switch (endpoint) {
      case 'pdf': {
        const pdfOptions = options.pdfOptions ?? DEFAULT_PDF_OPTIONS;
        requestBody.pdfOptions = pdfOptions;
        label = 'PDF';
        break;
      }
      case 'screenshot': {
        const screenshotOptions = options.screenshotOptions ?? DEFAULT_SCREENSHOT_OPTIONS;
        requestBody.screenshotOptions = screenshotOptions;
        label = (screenshotOptions as typeof screenshotOptions).type.toUpperCase();
        break;
      }
    }
    console.log(`Generating ${label} with Cloudflare API...`);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE.CONFIGS.ACCOUNT_ID}/browser-rendering/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CLOUDFLARE.CONFIGS.RENDERING_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      }
    );

    console.log(`${label} response status:`, response.status);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Cloudflare ${label} generation error:`, response.status, errorBody);
      throw new Error(`Cloudflare ${label} rendering failed with status ${response.status}: ${errorBody}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Error generating ${label}:`, error);
    throw new Error(error instanceof Error ? error.message : `Failed to generate ${label}`);
  }
}

/**
 * Renders HTML to a PDF via Cloudflare Browser Rendering's `/pdf` endpoint.
 * Defaults to 1100×780 for certificate canvases; pass custom viewport / pdfOptions
 * for other document types.
 */
export const getCloudflarePdfBuffer = async (
  html: string,
  styles?: string,
  viewport: RenderViewport = DEFAULT_VIEWPORT,
  pdfOptions: PdfPageOptions = DEFAULT_PDF_OPTIONS
): Promise<Buffer> => {
  return renderCloudflareBrowserDocument('pdf', { html, styles, viewport, pdfOptions });
};

/**
 * Renders HTML to a PNG via Cloudflare Browser Rendering's `/screenshot` endpoint.
 * Defaults to 1100×780 for certificate canvases; pass a custom viewport for other assets.
 */
export const getCloudflarePngBuffer = async (
  html: string,
  styles?: string,
  viewport: RenderViewport = { ...DEFAULT_VIEWPORT, deviceScaleFactor: 2 }
): Promise<Buffer> => {
  return renderCloudflareBrowserDocument('screenshot', {
    html,
    styles,
    viewport: { ...viewport, deviceScaleFactor: viewport.deviceScaleFactor ?? 2 },
    screenshotOptions: { type: 'png', omitBackground: false, fullPage: false }
  });
};
