import { Controller, ForbiddenException, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../../auth/auth-user.type.js';
import { AuditLog } from './entities/audit-log.entity.js';
import { AuditPolicy } from './audit.policy.js';

/**
 * Audit read access depends on a dynamically resolved scope (global /
 * own-organization / own-event), not a single static permission — so this
 * delegates straight to AuditPolicy instead of `@RequirePermission()`.
 */
@Controller('audit-log')
export class AuditController {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly auditPolicy: AuditPolicy,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
    @Query('eventId') eventId?: string,
  ) {
    const scope = await this.auditPolicy.resolveReadScope(user, { organizationId, eventId });

    if (scope.type === 'denied') {
      throw new ForbiddenException('You do not have access to this audit log scope.');
    }

    const where =
      scope.type === 'organization'
        ? { organizationId: scope.organizationId }
        : scope.type === 'event'
          ? { eventId: scope.eventId }
          : {};

    return this.auditLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
