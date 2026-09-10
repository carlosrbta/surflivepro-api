import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module.js';
import { OrganizationMembership } from './entities/organization-membership.entity.js';
import { Organization } from './entities/organization.entity.js';
import { OrganizationPolicy } from './organization.policy.js';
import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationMembership]), AuditModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationPolicy],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
