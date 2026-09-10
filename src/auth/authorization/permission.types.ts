export type Permission =
  | 'platform:manage'
  | 'organization:read'
  | 'organization:update'
  | 'organization:members:manage'
  | 'event:create'
  | 'event:read'
  | 'event:update'
  | 'event:manage'
  | 'athlete:read'
  | 'athlete:manage'
  | 'category:read'
  | 'category:manage'
  | 'heat:read'
  | 'heat:manage'
  | 'heat:finalize'
  | 'schedule:read'
  | 'schedule:manage'
  | 'score:create'
  | 'score:update'
  | 'score:review'
  | 'priority:manage'
  | 'result:read'
  | 'result:validate'
  | 'result:publish'
  | 'audit:read';

/**
 * Context a permission check is evaluated against. Which fields are required
 * depends on the permission's resource — resolved by AuthorizationGuard from
 * route params, not guessed by the caller.
 */
export interface AuthorizationContext {
  organizationId?: string;
  eventId?: string;
}
