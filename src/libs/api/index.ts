/**
 * @module API boundary helpers.
 *
 * Single entry point for the two auth-wrapper families:
 * - Route-handler middleware (`withAuth`, `withAdminAuth`, `withWebhookSecret`) — re-exported from `./middleware`
 * - Server-Action wrappers (`withActionAuth`, `withActionAuthNoInput`) — defined in `./withActionAuth`
 *
 * Error builders, client-side display helpers, and rate limiting keep their own
 * focused barrels (`./errors`, `./client`, `./rateLimit`) and are intentionally
 * not re-exported here to avoid an over-broad surface.
 */

// Route-handler middleware
export type { AdminHandler, AuthenticatedHandler, WebhookHandler } from './middleware';
export { withAdminAuth, withAuth, withWebhookSecret } from './middleware';

// Server-Action wrappers
export type { ActionAuthContext } from './withActionAuth';
export { withActionAuth, withActionAuthNoInput } from './withActionAuth';
