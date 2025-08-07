import { logger, schedules } from '@trigger.dev/sdk/v3';
import { cleanupExpiredSessions, cleanupOldLogs, cleanupTempFiles } from '../../utils/cleanup';

export const dailyCleanupTask = schedules.task({
  id: 'daily-cleanup',
  cron: '0 2 * * *', // Daily at 2 AM

  run: async (payload, { ctx }) => {
    logger.info('Starting daily cleanup');

    try {
      // Clean up old logs
      const logCleanupResult = await cleanupOldLogs();

      // Clean up temporary files
      const fileCleanupResult = await cleanupTempFiles();

      // Clean up expired sessions
      const sessionCleanupResult = await cleanupExpiredSessions();

      logger.info('Daily cleanup completed', {
        logsRemoved: logCleanupResult.count,
        filesRemoved: fileCleanupResult.count,
        sessionsRemoved: sessionCleanupResult.count
      });

      return {
        success: true,
        cleanupResults: {
          logs: logCleanupResult,
          files: fileCleanupResult,
          sessions: sessionCleanupResult
        }
      };
    } catch (error) {
      logger.error('Daily cleanup failed', {
        error: (error as Error).message
      });

      throw error;
    }
  }
});
