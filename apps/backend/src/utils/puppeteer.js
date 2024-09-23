// const puppeteer = require('puppeteer');

const getPdfBuffer = async (html, pdfParams) => {
  throw 'Puppeteer disabled';
  // const args = [
  //   '--disable-web-security',
  //   '--no-sandbox',
  //   '--disable-setuid-sandbox',
  // ];
  // const defaultPdfParams = {
  //   width: '1123px',
  //   height: '794px',
  // };

  // // launch a new chrome instance
  // const browser = await puppeteer.launch({
  //   headless: 'new',
  //   args,
  // });

  // // create a new page
  // const page = await browser.newPage();
  // await page.setViewport({ width: 1123, height: 794 });
  // await page.goto('data:text/html,' + html, { waitUntil: 'networkidle2' });
  // await page.addStyleTag({ content: '@page { size: auto; }' });
  // await page.emulateMediaType('screen');

  // // create a pdf buffer
  // const pdfBuffer = await page.pdf(pdfParams || defaultPdfParams);

  // // close the browser
  // await browser.close();

  // return pdfBuffer;
};

module.exports = {
  getPdfBuffer
};
