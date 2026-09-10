import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { auth } from '../auth.js';
import type { AuthUser } from '../auth-user.type.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

interface RequestWithUser extends Request {
  user?: AuthUser;
}

/**
 * Verifies authentication only, and attaches the current user to the
 * request. Authorization (permissions) is a separate guard (§7).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      if (isPublic) return true;
      throw new UnauthorizedException('Authentication required.');
    }

    request.user = {
      id: session.user.id,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      name: session.user.name,
      platformRole:
        (session.user as unknown as { platformRole?: 'PLATFORM_ADMIN' | 'USER' }).platformRole ??
        'USER',
    };

    return true;
  }
}
