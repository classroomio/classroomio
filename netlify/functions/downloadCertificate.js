var html_to_pdf = require('html-pdf-node');

exports.handler = async function (event, context) {
  console.log('body', event.body);
  const pdfBuffer = await generateCertificate(event.body);

  return {
    isBase64Encoded: true,
    statusCode: 200,
    headers: { 'Content-Type': 'application/pdf' },
    body: pdfBuffer,
  };
};

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
        .student-name {
          font-family: 'Qwitcher Grypen', cursive;
        }
        .desc {
          font-size: 10px;
        }
        .clamp {
          font-size: clamp(14px, 3vw, 16px);
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
  <div
    class="flex items-center justify-center border border-dashed border-blue-400"
  >
    <div class="border-l-8 border-blue-800">
      <div class="w-full px-5 py-3">
        <p class="text-sm font-normal my-2 uppercase text-gray-500">
          Certificate<br /> of completion
        </p>
        <div class="border-b border-gray-500 mb-4">
          <p class="text-xs text-black font-medium">This is to certify that</p>
          <p class="student-name text-center text-5xl">${studentName}</p>
        </div>
        <div class="mb-2">
          <p class="text-xs text-black font-medium">
            has successfully completed introductory courses in
          </p>
          <div>
            <p
              class="clamp bg-transparent text-base font-semibold text-blue-800 text-center uppercase my-2"
            >
              ${courseName}
            </p>
          </div>
        </div>
        <p class="desc mb-4 text-justify">${courseDescription}</p>
        <div class="flex items-center gap-1 my-2">
          <img
            src="${orgLogoUrl}"
            alt="logo"
            class="w-10 h-10 rounded-md"
          />
          <p class="font-semibold capitalize">${orgName}</p>
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
    <div
      class="flex flex-col items-center justify-center {borderwidth} {bordercolor} py-3"
    >
      <div class="flex items-center gap-1 my-2">
        <img
          src="${orgLogoUrl}"
          alt="logo"
          class=" w-10 h-10 rounded-md"
        />
        <p class="font-semibold capitalize">${orgName}</p>
      </div>
      <div class="w-full px-5 py-3">
        <p
          class="text-sm text-center font-normal my-2 uppercase tracking-widest text-gray-500 w-full"
        >
          Certificate of completion
        </p>
        <div class="border-b border-gray-500 mb-4">
          <p class="text-xs text-black font-medium">This is to certify that</p>
          <p class="student-name text-center text-5xl">${studentName}</p>
        </div>
        <div class="mb-2">
          <p class="text-xs text-black font-medium">
            has successfully completed a courses in
          </p>
          <div>
            <p
              class="clamp bg-transparent text-base font-semibold text-pink-700 text-center uppercase"
            >
              ${courseName}
            </p>
          </div>
        </div>
        <p class="desc text-center">${courseDescription}</p>
      </div>
    </div>
  `;
  return getHtmlTemplate(themeBody);
}

const generateCertificate = ({
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

  return html_to_pdf.generatePdf({ content: html }, { format: 'A4' });
};
