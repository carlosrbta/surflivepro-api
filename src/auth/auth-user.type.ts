import type { PlatformRole } from './authorization/roles.js';

/** The authenticated user, as attached to the request by AuthGuard. */
export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  platformRole: PlatformRole;
}
