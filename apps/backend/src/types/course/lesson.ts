import { z } from 'zod';

export const ZLessonDownloadContent = z.object({
  title: z.string(),
  number: z.string(),
  orgName: z.string(),
  note: z.string(),
  slideUrl: z.string().optional(),
  video: z.array(z.string()).optional(),
  courseTitle: z.string()
});

export type TLessonDownloadContent = z.infer<typeof ZLessonDownloadContent>;

export const ZCertificateDownload = z.object({
  theme: z.string().min(1),
  studentName: z.string().min(1),
  courseName: z.string().min(1),
  courseDescription: z.string().min(1),
  orgName: z.string().min(1),
  orgLogoUrl: z.string().url().optional(),
  facilitator: z.string().optional()
});

export type TCertificateDownload = z.infer<typeof ZCertificateDownload>;
