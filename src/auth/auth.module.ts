import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../modules/audit/audit.module.js';
import { EventMembership } from '../modules/events/entities/event-membership.entity.js';
import { Event } from '../modules/events/entities/event.entity.js';
import { OrganizationMembership } from '../modules/organizations/entities/organization-membership.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthorizationService } from './authorization/authorization.service.js';
import { AuthGuard } from './guards/auth.guard.js';
import { AuthorizationGuard } from './guards/authorization.guard.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationMembership, EventMembership, Event]),
    AuditModule,
  ],
  controllers: [AuthController],
  providers: [AuthorizationService, AuthGuard, AuthorizationGuard],
  exports: [AuthorizationService, AuthGuard, AuthorizationGuard],
})
export class AuthModule {}
