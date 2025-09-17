interface FromData {
  name: string;
  email: string;
}

// format: "ClassroomIO Developers (via ClassroomIO.com)" <notify@mail.classroomio.com>
export function extractNameAndEmail(str: string): FromData | undefined {
  // Use regular expressions to match the name and email
  const regex = /"(.*?)"\s+<\s*(.*?)@(.*?)\s*>/;
  const match = str.match(regex);

  if (match) {
    // Extract the name and email from the match groups
    const name = match[1];
    const email = match[2] + '@' + match[3];
    return { name, email };
  } else {
    // Return undefined if the format doesn't match
    return { name: str, email: str };
  }
}

export const withEmailTemplate = (content: string): string =>
  `<!DOCTYPE html>
<html>

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
  <base target="_blank" />

  <style>
    body {
      background-color: #F6F9FF;
      font-family: "Poppins", "Helvetica Neue", "Segoe UI", Helvetica,
        sans-serif;
      font-size: 15px;
      font-weight: 400;
      line-height: 26px;
      margin: 0;
    }

    pre {
      background: #f4f4f4;
      padding: 2px;
    }

    hr {
      border-top: 1px dashed #94a3b8;
      margin-top: 1rem;
      margin-bottom: 1rem;
    }

    table {
      width: 100%;
    }

    table td {
      padding: 5px 10px 0px;
      vertical-align: middle;
    }

    .socialicons {
      background-color: #fff;
      border-radius: 5px;
      padding: 5px;
      width: initial;
      margin: 0 auto;
      max-width: 200px;
    }

    .brandcolor {
      color: #00c4b8;
    }

    .tooltip {
      background-color: #f1f5f9;
      padding: 1rem;
      border-radius: 1rem;
      color: #475569;
      margin-top: 15px;
      margin-bottom: 15px;
    }

    .tooltip a {
      color: #1e293b;
    }

    .button {
      margin-top: 12px;
      background: #0233BD;
      border-radius: 8px;
      text-decoration: none !important;
      color: #fff !important;
      font-weight: 500;
      padding: 10px 30px;
      display: inline-block;
      font-size: 0.9em;
    }

    .button:hover {
      background: #0233BD;
    }

    .footer {
      text-align: center;
      font-size: 12px;
      color: #cbd5e1;
    }

    .footer a {
      color: #cbd5e1;
    }

    .gutter {
      padding: 5px 30px;
      text-align: center;
      background-color: #fff;
      border-bottom: 1px solid rgb(221, 208, 208);
      max-width: 525px;
      margin: 0 auto;
    }

    img {
      max-width: 100%;
      height: auto;
    }

    .gutter img {
      max-width: 280px;
    }

    h1,
    h2,
    h3,
    h4 {
      font-weight: 600;
    }

    @media screen and (max-width: 600px) {
      .wrap {
        max-width: auto;
      }

      .gutter {
        padding: 10px;
      }
    }
  </style>
</head>

<body style="
      background-color: #F6F9FF;
      font-family: 'Poppins', 'Helvetica Neue', 'Segoe UI', Helvetica,
        sans-serif;
      font-size: 15px;
      line-height: 26px;
      padding: 20px 0;
      margin: 0;
      color: #1e293b;
    ">
  <div class="gutter">
    <a href="https://classroomio.com" target="_blank">
      <img src="https://brand.cdn.clsrio.com/cio-bg-transparent.png" alt="ClassroomIO Logo" /></a>
  </div>
  <div class="wrap" style="
        background-color: #fff;
        padding: 40px 30px;
        max-width: 525px;
        margin: 0 auto;
      ">
    ${content}
  </div>

  <div class="footer" style="
    text-align: center;
    font-size: 12px;
    color: #fff;
    padding: 30px;
    background-color: #0542CC;
    max-width: 525px;
    margin: 0 auto;">
    <p>Find us on</p>
    <table class="socialicons">
      <tr>
        <td>
          <a target="_blank" href="https://twitter.com/classroomio"><img title="X"
              src="https://brand.cdn.clsrio.com/socials/twitter.png" alt="X" width="19" /></a>
        </td>
        <td>
          <a target="_blank" href="https://www.youtube.com/@ClassroomIO"><img title="Youtube"
              src="https://brand.cdn.clsrio.com/socials/youtube.png" alt="Youtube" width="24" /></a>
        </td>
        <td>
          <a target="_blank" href="https://www.facebook.com/classroomiohq"><img title="Facebook"
              src="https://brand.cdn.clsrio.com/socials/facebook.png" alt="Facebook" width="24" /></a>
        </td>
      </tr>
    </table>
    <p style="padding-top: 8px; line-height: initial">
      ClassroomIO ${new Date().getFullYear()}. All rights reserved.<br />
      <a style="text-decoration: none" href="https://app.enzuzo.com/policies/tos/958fc978-5477-11ee-a03b-7b111830c594"
        target="_blank">Terms</a>
      |
      <a style="text-decoration: none"
        href="https://app.enzuzo.com/policies/privacy/958fc978-5477-11ee-a03b-7b111830c594" target="_blank">Privacy
        Policy</a>
    </p>
  </div>
</body>

</html>
`;
