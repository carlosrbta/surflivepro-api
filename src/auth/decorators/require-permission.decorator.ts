import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../authorization/permission.types.js';

export const REQUIRE_PERMISSION_KEY = 'requirePermission';

export interface RequirePermissionOptions {
  /** Route param holding the organization id for context resolution. Defaults to `organizationId`. */
  organizationIdParam?: string;
  /** Route param holding the event id for context resolution. Defaults to `eventId`. */
  eventIdParam?: string;
}

export interface RequirePermissionMetadata extends RequirePermissionOptions {
  permission: Permission;
}

/**
 * Gates a route behind a single permission (doc §7: "No MVP, uma permission
 * por rota é suficiente"). AuthorizationGuard resolves organizationId/eventId
 * from the named route params to build the authorization context.
 */
export const RequirePermission = (permission: Permission, options: RequirePermissionOptions = {}) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, {
    permission,
    ...options,
  } satisfies RequirePermissionMetadata);
