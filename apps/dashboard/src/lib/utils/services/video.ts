import { classroomio } from './api';

export interface ProcessVideoRequest {
  fileKey: string;
  language?: string;
  lessonId?: string;
}

export interface ProcessVideoResponse {
  success: boolean;
  jobId: string;
  status: string;
  message: string;
}

export interface VideoStatusResponse {
  success: boolean;
  jobId: string;
  status: string;
  progress: number;
  result?: {
    manifestUrl: string;
    captions: {
      srtUrl: string;
      vttUrl: string;
      transcript: string;
      language: string;
    };
    qualities: string[];
    duration: number;
  };
  failedReason?: string;
}

/**
 * Start video processing (HLS encoding and caption generation)
 */
export async function processVideo(request: ProcessVideoRequest): Promise<ProcessVideoResponse> {
  try {
    const response = await classroomio.media.video.process.$post({
      json: request,
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to start video processing');
    }

    return data;
  } catch (error) {
    console.error('Error starting video processing:', error);
    throw error;
  }
}

/**
 * Get video processing status
 */
export async function getVideoProcessingStatus(jobId: string): Promise<VideoStatusResponse> {
  try {
    const response = await classroomio.media.video.status[':jobId'].$get({
      param: { jobId },
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error('Failed to get processing status');
    }

    return data;
  } catch (error) {
    console.error('Error getting video processing status:', error);
    throw error;
  }
}

/**
 * Poll video processing status until complete
 */
export async function waitForVideoProcessing(
  jobId: string,
  onProgress?: (progress: number) => void,
  maxWaitTime: number = 600000 // 10 minutes
): Promise<VideoStatusResponse> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const status = await getVideoProcessingStatus(jobId);

    if (onProgress && typeof status.progress === 'number') {
      onProgress(status.progress);
    }

    if (status.status === 'completed') {
      return status;
    }

    if (status.status === 'failed') {
      throw new Error(status.failedReason || 'Video processing failed');
    }

    // Wait 2 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error('Video processing timeout');
}
