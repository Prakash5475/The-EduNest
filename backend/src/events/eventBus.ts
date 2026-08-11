import { EventEmitter } from 'node:events';

export const DOMAIN_EVENTS = {
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN: 'user.logged_in',
  USER_LOGGED_OUT: 'user.logged_out',
  PASSWORD_CHANGED: 'user.password_changed',
  EMAIL_VERIFIED: 'user.email_verified',
} as const;

class EventBus extends EventEmitter {}

/**
 * Process-local pub/sub for decoupling side effects (e.g. audit logging,
 * cache invalidation) from the services that trigger them. Cross-process
 * events belong on BullMQ queues, not here.
 */
export const eventBus = new EventBus();
