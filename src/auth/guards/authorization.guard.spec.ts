import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuditService } from '../../modules/audit/audit.service.js';
import type { AuthUser } from '../auth-user.type.js';
import type { AuthorizationService } from '../authorization/authorization.service.js';
import { AuthorizationGuard } from './authorization.guard.js';

function makeContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('AuthorizationGuard', () => {
  let reflector: Reflector;
  let authorizationService: jest.Mocked<Pick<AuthorizationService, 'can'>>;
  let auditService: jest.Mocked<Pick<AuditService, 'record'>>;
  let guard: AuthorizationGuard;
  const user: AuthUser = {
    id: 'user-1',
    email: 'a@b.com',
    emailVerified: true,
    name: 'A',
    platformRole: 'USER',
  };

  beforeEach(() => {
    reflector = new Reflector();
    authorizationService = { can: jest.fn() };
    auditService = { record: jest.fn() };
    guard = new AuthorizationGuard(
      reflector,
      authorizationService as unknown as AuthorizationService,
      auditService as unknown as AuditService,
    );
  });

  it('passes through when the route has no @RequirePermission() metadata', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const result = await guard.canActivate(makeContext({ user, params: {} }));

    expect(result).toBe(true);
    expect(authorizationService.can).not.toHaveBeenCalled();
  });

  it('throws 403 and records an audit entry when the permission check fails', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue({ permission: 'organization:update' });
    authorizationService.can.mockResolvedValue(false);

    const request = {
      user,
      params: { organizationId: 'org-1' },
      headers: {},
      ip: '127.0.0.1',
    };

    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'user-1',
        action: 'authorization_denied',
        resource: 'organization:update',
        organizationId: 'org-1',
        result: 'DENIED',
      }),
    );
  });

  it('allows the request through when the permission check succeeds', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ permission: 'organization:read' });
    authorizationService.can.mockResolvedValue(true);

    const request = { user, params: { organizationId: 'org-1' }, headers: {} };

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('resolves organizationId/eventId from route params for the authorization context', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ permission: 'event:read' });
    authorizationService.can.mockResolvedValue(true);

    const request = { user, params: { eventId: 'event-1' }, headers: {} };

    await guard.canActivate(makeContext(request));

    expect(authorizationService.can).toHaveBeenCalledWith(user, 'event:read', {
      organizationId: undefined,
      eventId: 'event-1',
    });
  });
});
