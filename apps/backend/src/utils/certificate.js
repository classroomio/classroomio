const { getPdfBuffer } = require('./puppeteer');

function getHtmlTemplate(body) {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link
        href="https://fonts.googleapis.com/css2?family=Qwitcher+Grypen&family=Roboto:wght@300;400;700&display=swap"
        rel="stylesheet"
      />
      <script src="https://cdn.tailwindcss.com"></script>
      <title>Certificate</title>
      <style>
        body {
          width: 1123px;
          height: 794px;
        }
    
        .student-name {
          font-family: 'Qwitcher Grypen', cursive;
        }
      </style>
    </head>
    <body>
      ${body}
    </body>
  </html>
  `;
}

function getProfessionalTheme({
  studentName,
  courseName,
  courseDescription,
  orgLogoUrl,
  orgName,
}) {
  const themeBody = `
    <div class="flex items-center justify-center border border-dashed border-blue-400 h-full w-full">
      <div class="w-full h-full flex border-l-8 border-blue-800">
        <div class="h-full w-full px-5 py-10">
          <p class="text-2xl font-normal my-2 mb-10 uppercase text-gray-500">
            Certificate<br /> of completion
          </p>
          <div class="border-b border-gray-500 mb-4">
            <p class="text-xl text-black font-normal">This is to certify that</p>
            <p class="student-name text-center text-9xl">${studentName}</p>
          </div>
          <div class="mb-2">
            <p class="text-xl text-black font-normal">
              has successfully completed introductory courses in
            </p>
            <div>
              <p class="bg-transparent font-semibold text-blue-800 text-center uppercase my-10 text-3xl">
                ${courseName}
              </p>
            </div>
          </div>
          <p class="text-xl font-light mb-4 text-justify">
            ${courseDescription}
          </p>
          <div class="flex items-center gap-1 mt-14">
            <img
              src="${orgLogoUrl}"
              alt="logo" class="w-24 h-24 rounded-md" />
            <p class="font-semibold capitalize text-5xl">${orgName}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  return getHtmlTemplate(themeBody);
}

function getPlainTheme({
  studentName,
  courseName,
  courseDescription,
  orgLogoUrl,
  orgName,
}) {
  const themeBody = `
    <div class="flex flex-col items-center justify-center border-4 border-pink-700 py-3 w-full h-full">
      <div class="flex items-center gap-1 my-2 mb-10">
        <img
          src="${orgLogoUrl}"
          alt="logo" class=" w-24 h-24 rounded-md" />
        <p class="font-semibold capitalize text-5xl">${orgName}</p>
      </div>
      <div class="w-full px-5 py-3">
        <p class="text-xl text-center font-normal my-2 uppercase tracking-widest text-gray-500 w-full">
          Certificate of completion
        </p>
        <div class="border-b border-gray-500 mb-4">
          <p class="text-xl text-black font-normal">This is to certify that</p>
          <p class="student-name text-center text-8xl">${studentName}</p>
        </div>
        <div class="mb-2">
          <p class="text-xl text-black font-normal">
            has successfully completed a courses in
          </p>
          <div class="my-10">
            <p class="bg-transparent font-semibold text-pink-700 text-center uppercase text-3xl">
            ${courseName}
            </p>
          </div>
        </div>
        <p class="text-xl text-center text-gray-500 font-light">${courseDescription}</p>
      </div>
    </div>
  `;

  return getHtmlTemplate(themeBody);
}

const generateCertificate = async ({
  theme,
  studentName,
  courseName,
  courseDescription,
  orgLogoUrl,
  orgName,
}) => {
  const params = {
    studentName,
    courseName,
    courseDescription,
    orgLogoUrl,
    orgName,
  };
  console.log('theme', theme);

  const html =
    theme === 'plain' ? getPlainTheme(params) : getProfessionalTheme(params);
  console.log('body', html);

  return await getPdfBuffer(html);
};

module.exports = {
  generateCertificate,
};
