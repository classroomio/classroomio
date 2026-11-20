import type { TVideoBlockData } from '@cio/utils/validation/block';

export function createExampleVideo(): TVideoBlockData {
  return {
    type: 'generic',
    link: 'https://youtu.be/KrnMm5CRBK4?si=76KSQSuoIKYwjRrd',
    fileName: 'ClassroomIO product demo',
    metadata: {
      title: 'ClassroomIO product demo',
      createdAt: new Date().toISOString(),
      mimeType: 'video/mp4'
    }
  } as TVideoBlockData;
}
