import type { Permission } from './permission.types.js';

export type OrganizationRole = 'ORGANIZER' | 'MEMBER';
export type EventRole = 'HEAD_JUDGE' | 'JUDGE' | 'PRIORITY_JUDGE' | 'ATHLETE';
export type PlatformRole = 'PLATFORM_ADMIN' | 'USER';

/**
 * Static Role -> Permission map (doc §6/§7). No DB table, no generic
 * registry/resolver — just data consulted by AuthorizationService.
 */
export const ORGANIZATION_ROLE_PERMISSIONS: Record<OrganizationRole, Permission[]> = {
  ORGANIZER: [
    'organization:read',
    'organization:update',
    'organization:members:manage',
    'event:create',
    'event:read',
    'event:update',
    'event:manage',
    'athlete:read',
    'athlete:manage',
    'category:read',
    'category:manage',
    'heat:read',
    'heat:manage',
    'heat:finalize',
    'schedule:read',
    'schedule:manage',
    'result:read',
    'result:validate',
    'result:publish',
    'audit:read',
  ],
  MEMBER: ['organization:read'],
};

export const EVENT_ROLE_PERMISSIONS: Record<EventRole, Permission[]> = {
  HEAD_JUDGE: [
    'event:read',
    'heat:read',
    'heat:manage',
    'heat:finalize',
    'schedule:read',
    'score:review',
    'result:read',
    'result:validate',
    'audit:read',
  ],
  JUDGE: [
    'event:read',
    'heat:read',
    'schedule:read',
    'score:create',
    'score:update',
    'result:read',
  ],
  PRIORITY_JUDGE: ['event:read', 'heat:read', 'schedule:read', 'priority:manage', 'result:read'],
  ATHLETE: ['event:read', 'schedule:read', 'result:read'],
};

export const PLATFORM_ADMIN_PERMISSIONS: Permission[] = [
  'platform:manage',
  'organization:read',
  'organization:update',
  'organization:members:manage',
  'event:create',
  'event:read',
  'event:update',
  'event:manage',
  'athlete:read',
  'athlete:manage',
  'category:read',
  'category:manage',
  'heat:read',
  'heat:manage',
  'heat:finalize',
  'schedule:read',
  'schedule:manage',
  'score:create',
  'score:update',
  'score:review',
  'priority:manage',
  'result:read',
  'result:validate',
  'result:publish',
  'audit:read',
];
