const { getPdfBuffer } = require('./puppeteer');

function getCurrentDate() {
  const date = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

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
          height: 390px;
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
  facilitator,
  dateIssued
}) {
  const themeBody = `
    <div class="h-[794px] flex items-center justify-center border border-dashed border-blue-400 w-full">
      <div class="w-full h-full flex border-l-8 border-blue-800">
        <div class="h-full w-full px-5 py-10">
          <p class="text-2xl font-normal my-2 mb-10 uppercase text-gray-500">
            Certificate<br /> of completion
          </p>
          <div class="border-b border-gray-500 mb-4">
            <p class="text-xl text-black font-normal">This is to certify that</p>
            <p class=" text-center text-9xl student-name">${studentName}</p>
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
          <div class="flex justify-between w-[70%] mx-auto text-center items-end my-14">
            <div>
              <p class="font-bold">${dateIssued}</p>
              <h1 class="border-t border-black h-2/4 font-bold">Date Issued</h1>
            </div>

            
            <!-- <div>
              <h1 class="h-2/4">FACILITATOR:</h1>
              <p class="font-bold">${facilitator}</p>
            </div>-->

            <div class="w-[20%]">
              <h1 class="h-2/4 border-b border-black"></h1>
              <p class="font-bold">Signature</p>
            </div>
          </div>
          <div class="flex items-center gap-1 mt-14">
            <img src="${orgLogoUrl}" alt="logo" class="w-24 h-24 rounded-md" />
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
  dateIssued
}) {
  const themeBody = `
    <div class="h-[794px] flex flex-col items-center justify-center border-4 border-pink-700 py-3 w-full">
      <div class="flex items-center gap-1 my-2 mb-10">
        <img src="${orgLogoUrl}" alt="logo" class="w-24 h-24 rounded-md" />
        <p class="font-semibold capitalize text-5xl">${orgName}</p>
      </div>
      <div class="w-full px-5 py-3">
        <p class="text-xl text-center font-normal my-2 uppercase tracking-widest text-gray-500 w-full">
          Certificate of completion
        </p>
        <div class="border-b border-gray-500 mb-4">
          <p class="text-xl text-black font-normal">This is to certify that</p>
          <p class=" text-center text-8xl student-name">${studentName}</p>
        </div>
        <div class="mb-2">
          <p class="text-xl text-black font-normal">
            has successfully completed a courses in
          // </p>
          <div class="my-10">
            <p class="bg-transparent font-semibold text-pink-700 text-center uppercase text-3xl">
            ${courseName}
            </p>
          </div>
        </div>
        <p class="text-xl text-center text-gray-500 font-light">${courseDescription}</p>
        <div class="flex justify-between w-[70%] mx-auto text-center items-end my-14">
          <div>
            <p class="font-bold">${dateIssued}</p>
            <h1 class="border-t border-black h-2/4 font-bold">Date Issued</h1>
          </div>

          <div class="w-[20%]">
            <h1 class="h-2/4 border-b border-black"></h1>
            <p class="font-bold">Signature</p>
          </div>
        </div>
      </div>
    </div>
  `;

  return getHtmlTemplate(themeBody);
}

function getPurpleProfessionalBadge({
  studentName,
  courseName,
  courseDescription,
  orgLogoUrl,
  orgName,
  facilitator,
  dateIssued
}) {
  const themeBody = `
    <img
      src="https://assets.cdn.clsrio.com/certificates/purple-professional-badge-background.png"
      alt=""
      class="absolute top-0 left-0 w-full z-10"
    />
    <div class="absolute w-full pl-20 top-10 z-20">
      <header class="w-full flex justify-start items-center pt-10 gap-3 text-3xl font-bold">
        <img src="${orgLogoUrl}" class="w-24 h-24 rounded-md" />
        <h1>${orgName}</h1>
      </header>

      <div class="text-lg font-bold mt-[7%]">
        <h2>This certificate is awarded to</h2>
        <h1 class="text-3xl text-fuchsia-800">${studentName}</h1>
      </div>

      <div class="text-lg font-bold mt-10 w-[70%]">
        <h1>has succesfully completed training on</h1>
        <h2 class="text-5xl mt-3 leading-[3.5rem]">
          ${courseName}
        </h2>
      </div>

      <div class="flex justify-between w-[70%] mx-auto text-center items-end my-14">
        <div>
          <p class="font-bold">${dateIssued}</p>
          <h1 class="border-t border-black h-2/4 font-bold">Date Issued</h1>
        </div>

        <div class="w-[20%]">
          <h1 class="h-2/4 border-b border-black"></h1>
          <p class="font-bold">Signature</p>
        </div>
      </div>

      <footer class="text-sm w-[90%] pb-10">
        ${courseDescription}
      </footer>
    </div>
  `;

  return getHtmlTemplate(themeBody);
}

function getBlueProfessionalBadge({
  studentName,
  courseName,
  courseDescription,
  orgLogoUrl,
  orgName,
  facilitator,
  dateIssued
}) {
  const themeBody = `
    <img
      src="https://assets.cdn.clsrio.com/certificates/blue-professional-badge-background.png"
      alt=""
      class="absolute top-0 left-0 w-full z-10"
    />
    <div class="absolute w-full pl-20 top-10 z-20">
      <header class="w-full flex justify-start items-center pt-10 gap-3 text-3xl font-bold">
        <img src="${orgLogoUrl}" class="w-24 h-24 rounded-md" />
        <h1>${orgName}</h1>
      </header>

      <div class="text-lg font-bold mt-[7%]">
        <h2>This certificate is awarded to</h2>
        <h1 class="text-3xl text-blue-800">${studentName}</h1>
      </div>

      <div class="text-lg font-bold mt-10 w-[70%]">
        <h1>has succesfully completed training on</h1>
        <h2 class="text-5xl mt-3 leading-[3.5rem]">
          ${courseName}
        </h2>
      </div>

      <div class="flex border justify-between w-[70%] mx-auto text-center items-end my-14">
        <div>
          <p class="font-bold">${dateIssued}</p>
          <h1 class="border-t border-black h-2/4 font-bold">Date Issued</h1>
        </div>

        <div class="w-[20%]">
          <h1 class="h-2/4 border-b border-black"></h1>
          <p class="font-bold">Signature</p>
        </div>
      </div>

      <footer class="text-sm w-[90%] pb-10">
        ${courseDescription}
      </footer>
    </div>
  `;

  return getHtmlTemplate(themeBody);
}

function getPurpleProfessionalBadgePattern({
  studentName,
  courseName,
  courseDescription,
  orgLogoUrl,
  orgName,
  dateIssued
}) {
  const themeBody = `
  <img
    src="https://assets.cdn.clsrio.com/certificates/purple-lined-background.png"
    alt=""
    class="absolute top-0 left-0 w-full h-[100vh] z-10"
  />
  <div class="absolute z-20 left-[5%] top-16 w-[90%]">
      <header class="absolute w-full flex justify-center items-center pt-10 gap-3 text-3xl font-bold">
      <img src="${orgLogoUrl}" alt="" class="w-24 h-24 rounded-md" />
      <h1>${orgName}</h1>
    </header>

    <div class="pl-10 text-lg font-bold mt-[18%]">
      <h2>This certificate is awarded to</h2>
      <h1 class="text-3xl text-fuchsia-800">${studentName}</h1>
    </div>

    <div class="pl-10 text-lg font-bold mt-10 w-[70%]">
      <h1>has succesfully completed training on</h1>
      <h2 class="text-4xl leading-[2.5rem]">
        ${courseName}
      </h2>
    </div>

    <div class="flex border justify-between w-[70%] mx-auto text-center items-end my-14">
      <div>
        <p class="font-bold">${dateIssued}</p>
        <h1 class="border-t border-black h-2/4 font-bold">Date Issued</h1>
      </div>

      <div class="w-[20%]">
        <h1 class="h-2/4 border-b border-black"></h1>
        <p class="font-bold">Signature</p>
      </div>
    </div>

    <footer class="text-sm pl-10 w-[90%] pb-10">
      ${courseDescription}
    </footer>
  </div>
  `;

  return getHtmlTemplate(themeBody);
}

function getBlueProfessionalBadgePattern({
  studentName,
  courseName,
  courseDescription,
  orgLogoUrl,
  orgName,
  dateIssued
}) {
  const themeBody = `
    <img
      src="https://assets.cdn.clsrio.com/certificates/blue-lined-background.png"
      alt=""
      class="absolute top-0 left-0 w-full h-[100vh] z-10"
    />
    <div class="absolute z-20 left-[5%] top-16 w-[90%]">
      <header class="absolute w-full flex justify-center items-center pt-10 gap-3 text-3xl font-bold">
        <img src="${orgLogoUrl}" alt="" class="w-24 h-24 rounded-md" />
        <h1>${orgName}</h1>
      </header>

      <div class="pl-10 text-lg font-bold mt-[18%]">
        <h2>This certificate is awarded to</h2>
        <h1 class="text-3xl text-blue-800">${studentName}</h1>
      </div>

      <div class="pl-10 text-lg font-bold mt-10 w-[70%]">
        <h1>has succesfully completed training on</h1>
        <h2 class="text-4xl leading-[2.5rem]">
          ${courseName}
        </h2>
      </div>

      <div class="flex border justify-between w-[70%] mx-auto text-center items-end my-14">
        <div>
          <p class="font-bold">${dateIssued}</p>
          <h1 class="border-t border-black h-2/4 font-bold">Date Issued</h1>
        </div>

        <div class="w-[20%]">
          <h1 class="h-2/4 border-b border-black"></h1>
          <p class="font-bold">Signature</p>
        </div>
      </div>

      <footer class="text-sm pl-10 w-[90%] pb-10">
        ${courseDescription}
      </footer>
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
  facilitator
}) => {
  const dateIssued = getCurrentDate();

  const params = {
    studentName,
    courseName,
    courseDescription,
    orgLogoUrl,
    orgName,
    facilitator,
    dateIssued
  };
  console.log('theme', theme);

  const themeFunctions = {
    plain: getPlainTheme,
    professional: getProfessionalTheme,
    purpleProfessionalBadge: getPurpleProfessionalBadge,
    blueProfessionalBadge: getBlueProfessionalBadge,
    purpleBadgePattern: getPurpleProfessionalBadgePattern,
    blueBadgePattern: getBlueProfessionalBadgePattern
  };

  // set plain (getPlainTheme) as the default theme
  const selectedThemeFunction = themeFunctions[theme] || getPlainTheme;
  const html = selectedThemeFunction(params);
  console.log('body', html);

  return await getPdfBuffer(html);
};

module.exports = {
  generateCertificate
};
