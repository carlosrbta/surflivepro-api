import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventMembership } from '../events/entities/event-membership.entity.js';
import { OrganizationMembership } from '../organizations/entities/organization-membership.entity.js';
import { AuditController } from './audit.controller.js';
import { AuditPolicy } from './audit.policy.js';
import { AuditService } from './audit.service.js';
import { AuditLog } from './entities/audit-log.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, OrganizationMembership, EventMembership])],
  controllers: [AuditController],
  providers: [AuditService, AuditPolicy],
  exports: [AuditService],
})
export class AuditModule {}
