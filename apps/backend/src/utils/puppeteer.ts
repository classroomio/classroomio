import puppeteer, { type PDFOptions } from 'puppeteer';

export interface PdfParams extends Partial<PDFOptions> {
  width?: string;
  height?: string;
  format?:
    | 'Letter'
    | 'Legal'
    | 'Tabloid'
    | 'Ledger'
    | 'A0'
    | 'A1'
    | 'A2'
    | 'A3'
    | 'A4'
    | 'A5'
    | 'A6';
  landscape?: boolean;
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export interface PdfGenerationResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
}

export const getPdfBuffer = async (html: string, pdfParams?: PdfParams) => {
  const args = ['--disable-web-security', '--no-sandbox', '--disable-setuid-sandbox'];

  const defaultPdfParams: PdfParams = {
    width: '1123px',
    height: '794px',
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0',
      right: '0',
      bottom: '0',
      left: '0'
    }
  };

  try {
    // launch a new chrome instance
    const browser = await puppeteer.launch({
      headless: true,
      args
    });

    // create a new page
    const page = await browser.newPage();
    await page.setViewport({ width: 1123, height: 794 });
    await page.goto('data:text/html,' + html, { waitUntil: 'networkidle2' });
    await page.addStyleTag({ content: '@page { size: auto; }' });
    await page.emulateMediaType('screen');

    // create a pdf buffer
    const pdfBuffer = await page.pdf(pdfParams || defaultPdfParams);

    // close the browser
    await browser.close();

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate PDF');
  }
};
