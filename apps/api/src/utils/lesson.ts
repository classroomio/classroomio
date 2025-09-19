import type { TLessonDownloadContent } from '$src/types/course/lesson';
import { marked } from 'marked';

function getHtmlTemplate(body: string): string {
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

        header {
          background-color: rgb(0, 48, 255);
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
    <body class="w-full">
      ${body}
    </body>
  </html>
  `;
}

function getLessonBody({
  title,
  number,
  orgName,
  note,
  slideUrl,
  video,
  courseTitle
}: TLessonDownloadContent): string {
  const noteHtml = marked.parse(note);
  const showExtraResources = slideUrl || (video && video.length > 0);
  return `
    <div class="root mx-auto mt-5 prose">
      <header
        class="w-full h-40 flex flex-col items-center justify-center gap-2 rounded-lg m-0">
        <h3
          class="my-0 rounded-full w-10 text-center mx-auto py-1 text-blue-700 bg-white text-md font-bold tracking-tighter">
          ${number}
        </h3>
        <h1 class="text-white m-0">${title}</h1>
        <h4 class="roboto-mono text-md font-normal text-white m-0">By ${orgName}</h4>
      </header>
  
      <main>
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

    </div>
  `;
}

async function generateSinglePdfFromHtml(
  htmlContent: string,
  courseTitle: string
): Promise<Buffer> {
  throw 'Download disabled';
}

export async function generateLessonPdf(params: TLessonDownloadContent): Promise<Buffer> {
  const body = getLessonBody(params);
  const html = getHtmlTemplate(body);
  console.log(html);
  return await generateSinglePdfFromHtml(html, params.courseTitle);
}
