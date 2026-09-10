import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../auth-user.type.js';

interface RequestWithUser {
  user?: AuthUser;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
