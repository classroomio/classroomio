import type { TCertificateDownload } from '$src/types/course/lesson';
import { getCloudflarePdfBuffer } from '$src/utils/cloudflare';

export interface CertificateData {
  theme: string;
  studentName: string;
  courseName: string;
  courseDescription: string;
  orgLogoUrl: string;
  orgName: string;
  facilitator?: string;
}

export interface CertificateGenerationResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
}

export const generateCertificate = async (data: TCertificateDownload) => {
  const { html, styles } = generateCertificateHtml(data);
  return getCloudflarePdfBuffer(html, styles);
};

function generateCertificateHtml(data: TCertificateDownload): { html: string; styles: string } {
  const { studentName, courseName, courseDescription, orgLogoUrl, orgName, facilitator } = data;

  const html = `
    <html>
      <head>
        <meta charset="utf-8">
        <title>Certificate of Completion</title>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <img src="${orgLogoUrl}" alt="${orgName} Logo" class="logo">
            <h1 class="title">Certificate of Completion</h1>
          </div>
          <div class="content">
            <h2 class="student-name">${studentName}</h2>
            <p class="course-name">${courseName}</p>
            <p class="description">${courseDescription}</p>
          </div>
          <div class="footer">
            <div class="signature">
              <p>${facilitator || 'Course Facilitator'}</p>
              <p>${orgName}</p>
            </div>
            <p class="date">${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const styles = `
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .certificate {
      width: 1123px;
      height: 794px;
      margin: 0 auto;
      background-color: white;
      position: relative;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding: 20px;
    }
    .logo {
      max-width: 200px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 36px;
      color: #333;
      margin-bottom: 10px;
    }
    .content {
      text-align: center;
      padding: 40px;
    }
    .student-name {
      font-size: 48px;
      color: #2c3e50;
      margin-bottom: 20px;
    }
    .course-name {
      font-size: 24px;
      color: #34495e;
      margin-bottom: 10px;
    }
    .description {
      font-size: 18px;
      color: #7f8c8d;
      margin-bottom: 30px;
    }
    .footer {
      position: absolute;
      bottom: 40px;
      width: 100%;
      text-align: center;
    }
    .signature {
      margin-top: 20px;
    }
    .date {
      margin-top: 10px;
      color: #95a5a6;
    }
  `;
  const pdf = {
    html: html,
    styles: styles
  };

  return pdf;
}
