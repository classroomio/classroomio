import { createEmailWorker, createVideoWorker } from '@cio/queue';

export function initializeQueues() {
  console.log('Initializing queues...');
  
  try {
    createEmailWorker();
    console.log('Email worker initialized');
  } catch (error) {
    console.error('Failed to initialize email worker:', error);
  }

  try {
    createVideoWorker();
    console.log('Video worker initialized');
  } catch (error) {
    console.error('Failed to initialize video worker:', error);
  }
  
  console.log('All queues initialized');
}