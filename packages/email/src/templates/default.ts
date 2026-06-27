import type { EmailBranding } from '../core/branding';

const DEFAULT_BUTTON_COLOR = '#1D4EE2';
const CLASSROOMIO_LOGO = 'https://brand.cdn.clsrio.com/cio-bg-transparent.png';

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildMasthead(branding: EmailBranding): string {
  const logoUrl = branding?.logoUrl;
  const orgName = branding?.orgName ? escapeHtmlAttr(branding.orgName) : '';

  if (logoUrl) {
    const nameHtml = orgName
      ? `<span style="margin-left:10px;font-size:16px;font-weight:600;color:#111827;vertical-align:middle;">${orgName}</span>`
      : '';
    return `<img src="${logoUrl}" alt="${orgName || 'Logo'}" style="max-height:40px;width:auto;display:inline-block;vertical-align:middle;" />${nameHtml}`;
  }

  if (orgName) {
    return `<span style="font-size:18px;font-weight:600;color:#111827;">${orgName}</span>`;
  }

  return `<a href="https://classroomio.com" target="_blank">
        <img src="${CLASSROOMIO_LOGO}" alt="ClassroomIO" width="130" style="width:130px;height:auto;display:block;" />
      </a>`;
}

export const getDefaultTemplate = (content: string, branding?: EmailBranding): string => {
  const buttonColor = branding?.themeColor || DEFAULT_BUTTON_COLOR;
  const masthead = buildMasthead(branding);

  return `<!DOCTYPE html>
<html>

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
  <base target="_blank" />

  <style>
    body {
      background-color: #F0F5FF;
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
      background: ${buttonColor};
      border-radius: 6px;
      text-decoration: none !important;
      color: #fff !important;
      font-weight: 500;
      padding: 8px 16px;
      display: inline-block;
      font-size: 14px;
      line-height: 20px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .footer {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }

    .footer a {
      color: #94a3b8;
    }

    img {
      max-width: 100%;
      height: auto;
    }

    h1,
    h2,
    h3,
    h4 {
      font-weight: 600;
    }
  </style>
</head>

<body style="
      background-color: #F0F5FF;
      font-family: 'Poppins', 'Helvetica Neue', 'Segoe UI', Helvetica,
        sans-serif;
      font-size: 15px;
      line-height: 26px;
      padding: 20px 15px;
      margin: 0;
      color: #1e293b;
    ">
  <div style="background-color:#fff;max-width:525px;margin:0 auto;border-radius:4px;">
    <div style="padding:10px;border-bottom:1px solid #f0f0f0;">
      ${masthead}
    </div>
    <div style="padding:10px 15px;">
      ${content}
    </div>
    <div class="footer" style="
      text-align:center;
      font-size:11px;
      color:#94a3b8;
      padding:24px 30px;
      border-top:1px solid #f0f0f0;">
      ClassroomIO ${new Date().getFullYear()}. All rights reserved.
      <br />
      <a href="https://classroomio.com" style="color:#94a3b8;text-decoration:none;">Website</a>
      &nbsp;&middot;&nbsp;
      <a href="https://classroomio.com/tos" style="color:#94a3b8;text-decoration:none;">Terms</a>
      &nbsp;&middot;&nbsp;
      <a href="https://classroomio.com/privacy" style="color:#94a3b8;text-decoration:none;">Privacy</a>
    </div>
  </div>
</body>

</html>
`;
};
