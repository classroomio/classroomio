import { apiClient } from './api';

export interface TriggerWelcomeEmailParams {
  userId: string;
  email: string;
  name: string;
}

export interface TriggerCleanupParams {
  // Add any cleanup parameters if needed
}

export class TriggerService {
  static async triggerWelcomeEmail(params: TriggerWelcomeEmailParams) {
    try {
      const response = await apiClient.post('/api/trigger/welcome-email', params);
      return response.data;
    } catch (error) {
      console.error('Welcome email trigger failed:', error);
      throw error;
    }
  }

  static async triggerCleanup(params: TriggerCleanupParams = {}) {
    try {
      const response = await apiClient.post('/api/trigger/cleanup', params);
      return response.data;
    } catch (error) {
      console.error('Cleanup trigger failed:', error);
      throw error;
    }
  }
}
