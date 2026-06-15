// Re-export shared schema instance
export { DB_SCHEMA_NAME, vtSaasSchema } from './_db-schema';

// Re-export all table definitions + enums (sorted alphabetically by module)
export { adminAuditLog } from './audit';
export { feedback, feedbackStatusEnum, feedbackTypeEnum } from './feedback';
export { platformConnections } from './platform-connections';
export { userPreferences } from './preferences';
export type { InsertResourceUsage, ResourceUsage } from './resource-usage';
export { resourceUsage } from './resource-usage';
export type { InsertScheduledTask, ScheduledTaskRow } from './scheduled-tasks';
export { scheduledTasks, scheduledTaskStatusEnum } from './scheduled-tasks';
export { shareableLinks } from './share-links';
export type { InsertStripeWebhookEvent, StripeWebhookEvent } from './stripe-webhook-events';
export { stripeWebhookEvents } from './stripe-webhook-events';
export type { InsertSubscriptionTier, SubscriptionTier } from './subscription-tiers';
export { subscriptionTiers } from './subscription-tiers';
export { threads } from './threads';
export type { InsertTierQuota, TierQuota } from './tier-quotas';
export { tierQuotas } from './tier-quotas';
export type {
  BillingInterval,
  InsertUserSubscription,
  UserSubscription,
  UserSubscriptionStatus,
} from './user-subscriptions';
export {
  billingIntervalEnum,
  userSubscriptions,
  userSubscriptionStatusEnum,
} from './user-subscriptions';
export {
  mem0Memories,
  memoryExtractionJobs,
  vercelConversations,
  vercelMessages,
} from './vercel-chat';
