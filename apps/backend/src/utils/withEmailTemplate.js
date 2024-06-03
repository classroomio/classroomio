const withEmailTemplate = (content) =>
  `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
    <base target="_blank" />

    <style>
      body {
        background-color: #f1f5f9;
        font-family: 'Poppins', 'Helvetica Neue', 'Segoe UI', Helvetica, sans-serif;
        font-size: 15px;
        font-weight: 300;
        line-height: 26px;
        margin: 0;
        color: black;
        padding: 4px 0px;
        display: flex;
        justify-content: center;
        align-items: center;
        max-width: 100%;
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
        background-color: white;
        border-radius: 4px;
        padding: 2px 10px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: row;
      }
      table td {
        padding: 5px;
      }
      table tr {
        display: flex;
        align-items: center;
        flex-direction: row;
      }
      table td a {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .socialicons {
        max-width: 200px;
      }

      .wrap {
        padding: 30px;
        max-width: 525px;
        margin: 0 auto;
        border-radius: 12px;
        font-weight: normal;
        text-align: justify;
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
        background-color: #0233bd;
        color: white;
        width: 100%;
        border-radius: 6px;
        border: none;
        font-weight: 600;
        font-size: medium;
        padding: 16px 0;
        margin: 20px 0;
      }

      footer {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        text-align: center;
        font-size: 16px;
        font-weight: 600;
        color: white;
        background-color: #0542cc;
      }
      footer a {
        color: white;
        margin-right: 5px;
      }

      .gutter {
        text-align: center;
        padding: 5px;
        border-bottom: 1px solid rgb(221, 208, 208);
      }

      img {
        max-width: 100%;
        height: auto;
      }

      .gutter img {
        max-width: 280px;
      }

      a {
        color: #0233bd;
      }
      a:hover {
        color: #0233bd;
      }
      h1,
      h2,
      h3,
      h4 {
        font-weight: 600;
      }
      @media screen and (max-width: 600px) {
        body {
          background-color: white;
        }
        .wrap {
          max-width: auto;
        }
        .gutter {
          padding: 10px;
        }
      }
    </style>
  </head>
  <body>
    <div
      style="
        background-color: #fff;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        max-width: 525px;
      "
    >
      <div class="gutter">
        <a href="https://classroomio.com" target="_blank">
          <img
            src="https://tapaozmyjsuykgerrfkt.supabase.co/storage/v1/object/public/avatars/cio-logo-full.png"
            alt="ClassroomIO Logo"
        /></a>
      </div>
      <div class="wrap">
        ${content}
      </div>
      <footer>
        <p>Find us on</p>
        <table class="socialicons">
          <tr>
            <td>
              <a target="_blank" href="https://www.facebook.com/classroomiohq"
                ><img
                  title="Facebook"
                  src="https://brand.cdn.clsrio.com/socials/facebook.svg"
                  alt="Facebook"
                  width="24"
                  height="24"
              /></a>
            </td>
            <td>
              <a target="_blank" href="https://www.linkedin.com/company/classroomio/"
                ><img
                  title="linkedin"
                  src="https://brand.cdn.clsrio.com/socials/linkedin.svg"
                  alt="X"
                  width="24"
                  height="24"
              /></a>
            </td>
            <td>
              <a target="_blank" href="https://www.youtube.com/@ClassroomIO"
                ><img
                  title="Youtube"
                  src="https://brand.cdn.clsrio.com/socials/youtube.svg"
                  alt="Youtube"
                  width="24"
                  height="24"
              /></a>
            </td>
            <td>
              <a target="_blank" href="https://twitter.com/classroomio"
                ><img
                  title="X"
                  src="https://brand.cdn.clsrio.com/socials/twitter.svg"
                  alt="X"
                  width="24"
                  height="24"
              /></a>
            </td>
          </tr>
        </table>
        <p style="padding-top: 8px; line-height: initial">
          ClassroomIO ${new Date().getFullYear()}. All rights reserved.<br />
          <a
            style="text-decoration: none"
            href="https://app.enzuzo.com/policies/tos/958fc978-5477-11ee-a03b-7b111830c594"
            target="_blank"
            >Terms</a
          >
          |
          <a
            style="text-decoration: none"
            href="https://app.enzuzo.com/policies/privacy/958fc978-5477-11ee-a03b-7b111830c594"
            target="_blank"
            >Privacy Policy</a
          >
        </p>
      </footer>
    </div>
  </body>
</html>

`;
module.exports = { withEmailTemplate };
