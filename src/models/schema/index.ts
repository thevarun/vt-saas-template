// Re-export shared schema instance
export { DB_SCHEMA_NAME, vtSaasSchema } from './_db-schema';

// Re-export all table definitions + enums (sorted alphabetically by module)
export { adminAuditLog } from './audit';
export { feedback, feedbackStatusEnum, feedbackTypeEnum } from './feedback';
export { platformConnections } from './platform-connections';
export { userPreferences } from './preferences';
export type { InsertScheduledTask, ScheduledTaskRow } from './scheduled-tasks';
export { scheduledTasks, scheduledTaskStatusEnum } from './scheduled-tasks';
export { shareableLinks } from './share-links';
export { threads } from './threads';
export {
  mem0Memories,
  memoryExtractionJobs,
  vercelConversations,
  vercelMessages,
} from './vercel-chat';
