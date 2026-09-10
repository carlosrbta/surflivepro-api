import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuditService } from '../../modules/audit/audit.service.js';
import type { AuthUser } from '../auth-user.type.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import {
  REQUIRE_PERMISSION_KEY,
  type RequirePermissionMetadata,
} from '../decorators/require-permission.decorator.js';

interface RequestWithUser extends Request {
  user?: AuthUser;
}

/**
 * Enforces `@RequirePermission()`. A no-op when a route carries no such
 * metadata — fine-grained scope checks that don't reduce to a single static
 * permission (e.g. Audit Log reads) are handled by their own Policy instead
 * (§7 flow: ... -> AuthorizationGuard -> AuthorizationService -> Domain
 * Policy -> Service ...).
 */
@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
    private readonly auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<RequirePermissionMetadata | undefined>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!metadata) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // AuthGuard runs first and always attaches a user or throws 401.
    if (!user) throw new ForbiddenException('Not authorized.');

    const params = request.params as Record<string, string | undefined>;
    const organizationId = params[metadata.organizationIdParam ?? 'organizationId'];
    const eventId = params[metadata.eventIdParam ?? 'eventId'];

    const allowed = await this.authorizationService.can(user, metadata.permission, {
      organizationId,
      eventId,
    });

    if (!allowed) {
      await this.auditService.record({
        actorUserId: user.id,
        action: 'authorization_denied',
        resource: metadata.permission,
        organizationId: organizationId ?? null,
        eventId: eventId ?? null,
        result: 'DENIED',
        ip: request.ip ?? null,
        userAgent: request.headers['user-agent'] ?? null,
      });

      throw new ForbiddenException('You do not have permission to perform this action.');
    }

    return true;
  }
}
