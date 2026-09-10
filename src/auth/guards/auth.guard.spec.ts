import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { auth } from '../auth.js';
import { AuthGuard } from './auth.guard.js';

jest.mock('../auth', () => ({
  auth: { api: { getSession: jest.fn() } },
}));
// better-auth/node ships ESM-only, which ts-jest doesn't transform inside
// node_modules — stub it since these tests never need its real conversion.
jest.mock('better-auth/node', () => ({
  fromNodeHeaders: (headers: unknown) => headers,
}));

const getSession = auth.api.getSession as unknown as jest.Mock;

function makeContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let reflector: Reflector;
  let guard: AuthGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AuthGuard(reflector);
    getSession.mockReset();
  });

  it('throws 401 when there is no session and the route is not public', async () => {
    getSession.mockResolvedValue(null);
    const request = { headers: {} };

    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('allows an unauthenticated request through on a @Public() route', async () => {
    getSession.mockResolvedValue(null);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const request = { headers: {} };

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
  });

  it('attaches the current user to the request on a valid session', async () => {
    getSession.mockResolvedValue({
      session: {},
      user: {
        id: 'user-1',
        email: 'a@b.com',
        emailVerified: true,
        name: 'A',
        platformRole: 'USER',
      },
    });
    const request: { headers: Record<string, string>; user?: unknown } = { headers: {} };

    const result = await guard.canActivate(makeContext(request));

    expect(result).toBe(true);
    expect(request.user).toEqual(
      expect.objectContaining({ id: 'user-1', email: 'a@b.com', platformRole: 'USER' }),
    );
  });
});
