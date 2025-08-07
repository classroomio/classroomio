import {
  cleanupExpiredSessions,
  cleanupOldLogs,
  cleanupTempFiles
} from "./chunk-7NJJH7MV.mjs";
import {
  logger,
  schedules_exports
} from "./chunk-IMKCPWQB.mjs";
import {
  init_esm
} from "./chunk-KJE3LWUS.mjs";

// src/trigger/task/schedule-tasks/daily-cleanup.ts
init_esm();
var dailyCleanupTask = schedules_exports.task({
  id: "daily-cleanup",
  cron: "0 2 * * *",
  // Daily at 2 AM
  run: async (payload, { ctx }) => {
    logger.info("Starting daily cleanup");
    try {
      const logCleanupResult = await cleanupOldLogs();
      const fileCleanupResult = await cleanupTempFiles();
      const sessionCleanupResult = await cleanupExpiredSessions();
      logger.info("Daily cleanup completed", {
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
      logger.error("Daily cleanup failed", {
        error: error.message
      });
      throw error;
    }
  }
});

export {
  dailyCleanupTask
};
//# sourceMappingURL=chunk-UKVCEJG3.mjs.map
