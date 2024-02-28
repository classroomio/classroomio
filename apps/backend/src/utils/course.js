// const { getPdfBuffer } = require('./puppeteer');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

function getHtmlTemplate(body) {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link
        href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100;200;300;400&family=Roboto:wght@100;300;400;500;700;900&display=swap"
        rel="stylesheet" />
      <script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,line-clamp"></script>
      <title>Lesson Note</title>
      <style>
        html {
          -webkit-print-color-adjust: exact;
        }
    
        body {
          font-family: 'Roboto', sans-serif;
        }

        .prose h1 {
          margin: 0;
        }
    
        .prose h2 {
          margin: 0.5rem 0 1.5rem 0;
        }
    
        .prose h3 {
          margin: 0.5rem 0;
        }
    
        .roboto-mono {
          font-family: 'Roboto Mono', monospace;
        }

        span {
          font-size: 0.8rem;
        }
    
        section {
          margin-top: 5%;
        }
    
        .root {
          width: 95%;
        }
      </style>
      <style type="text/tailwindcss">
        @tailwind base;
        @tailwind base;
        @tailwind components;
        @tailwind utilities;
        
        .prose {
          max-width: unset;
        }
      </style>
    </head>
    <body class="w-full break-after-page">
      ${body}
    </body>
  </html>
  `;
}

function getLessonBody(
  { lessonTitle, lessonNumber, lessonNote, slideUrl, video },
  orgName,
  orgTheme
) {
  const noteHtml = marked.parse(lessonNote);
  const showExtraResources = slideUrl || (video && video.length > 0);
  return `
  <div
  class="bg-[${
    orgTheme ? orgTheme : '#0030FF'
  }] w-full h-40 flex flex-col items-center justify-center gap-2 rounded-lg m-0">
  <h3
    class="my-0 rounded-full w-10 text-center mx-auto py-1 text-[${
      orgTheme ? orgTheme : '#0030FF'
    }] bg-white text-md font-bold tracking-tighter">
    ${lessonNumber}
  </h3>
  <h1 class="text-white m-0">${lessonTitle}</h1>
  <h4 class="roboto-mono text-md font-normal text-white m-0">By ${orgName}</h4>
</div>

<main class="break-after-page">
  <section>
  ${noteHtml}
  </section>

  <section>
  ${
    showExtraResources
      ? `
      <section>
        <h1 class='text-xl font-bold my-1'>Extra Resources</h1>
        ${
          slideUrl
            ? `<div class="flex mt-2 mb-1">
                  <p class="m-0 mr-2">Slide Link:</p> <a href=${slideUrl} style="color: blue" class="underline">Open Here</a>
              </div>`
            : ''
        }
        ${
          video && video.length > 0
            ? `
              <p class="m-0">Video Link:</p>
              <div class="m-0">
                <ol class="m-0">
                  ${video
                    .map(
                      (videoData, index) => `
                      <li key=${
                        index + 1
                      }><a href=${videoData} style="color: blue" class="underline">${videoData}</a></li> 
                  `
                    )
                    .join('')}
                </ol>
              </div>
              `
            : ''
        }
      </section>
    `
      : ''
  }
  </section>
</main>
  `;
}

function getCourseBody({ courseTitle, orgName, orgTheme, lessons }) {
  return `
    <header class="flex justify-center items-center flex-col border-[${
      orgTheme ? orgTheme : '#0030FF'
    }] border-[40px] mx-3 h-[100vh] m-0">
      <h1 class="font-bold text-8xl text-black m-0 mx-96">${courseTitle}</h1>
      <h4 class="text-md text-2xl font-light text-black mt-5 ">${orgName}</h4>
    </header>
    <div class="root mx-auto mt-5 prose break-after-page">
      ${lessons.map((lesson) => getLessonBody(lesson, orgName, orgTheme))}
    </div>
  `;
}

async function generateSinglePdfFromHtml(htmlContent, courseTitle, orgTheme) {
  const args = [
    '--disable-web-security',
    '--no-sandbox',
    '--disable-setuid-sandbox',
  ];
  const browser = await puppeteer.launch({
    headless: 'new',
    args,
  });
  const page = await browser.newPage();

  await page.setContent(htmlContent);

  const pdfOptions = {
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate:
      "<div><div class='pageNumber'></div> <div>/</div><div class='totalPages'></div></div>",
    footerTemplate: `
        <div class="footer" style="position: relative; display: flex; text-align: right; margin-right: 5%; font-size: 8px; width: 297mm; padding-top: 30px;">
          <div style="position: absolute; right: 50%; bottom: 3%;"><span class="pageNumber"></span>/<span class="totalPages"></span></div>
          <div style="position: absolute; right: 0; bottom: 3%;">${courseTitle} | Powered by <a href="https://app.classroomio.com" style="text-decoration: underline;">ClassroomIO</a></div>
        </div>
      `,
    margin: {
      top: '0.3cm',
      bottom: '0.5cm',
    },
  };

  const numPages = await page.evaluate(() => {
    const content = document.body; // Change this to the specific element containing content
    const style = window.getComputedStyle(content);
    const contentHeight = parseInt(style.height, 10);
    const pageHeight = 900; // Set this to an appropriate value based on your PDF format

    return Math.ceil(contentHeight / pageHeight);
  });

  const pagesPdfBuffer = [];

  for (let currentPage = 1; currentPage <= numPages; currentPage++) {
    await page.evaluate(() => {});

    const pdfBuffer = await page.pdf(pdfOptions);
    pagesPdfBuffer.push(pdfBuffer);
  }

  await browser.close();
  return Buffer.concat(pagesPdfBuffer);
}

async function generateCoursePdf(params) {
  // Generate the course boddy
  const body = getCourseBody(params);
  const html = getHtmlTemplate(body);
  console.log(html);
  return await generateSinglePdfFromHtml(html, params.courseTitle);
}

module.exports = {
  generateCoursePdf,
};
