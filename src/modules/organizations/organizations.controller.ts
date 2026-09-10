import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import type { AuthUser } from '../../auth/auth-user.type.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  addOrganizationMemberSchema,
  updateOrganizationMemberSchema,
  type AddOrganizationMemberDto,
  type UpdateOrganizationMemberDto,
} from './dto/add-member.schema.js';
import {
  createOrganizationSchema,
  type CreateOrganizationDto,
} from './dto/create-organization.schema.js';
import {
  updateOrganizationSchema,
  type UpdateOrganizationDto,
} from './dto/update-organization.schema.js';
import { OrganizationsService } from './organizations.service.js';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createOrganizationSchema)) dto: CreateOrganizationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organizationsService.create(dto, user.id);
  }

  @Get(':organizationId')
  @RequirePermission('organization:read')
  findOne(@Param('organizationId') organizationId: string) {
    return this.organizationsService.findOne(organizationId);
  }

  @Patch(':organizationId')
  @RequirePermission('organization:update')
  update(
    @Param('organizationId') organizationId: string,
    @Body(new ZodValidationPipe(updateOrganizationSchema)) dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(organizationId, dto);
  }

  @Get(':organizationId/members')
  @RequirePermission('organization:read')
  listMembers(@Param('organizationId') organizationId: string) {
    return this.organizationsService.listMembers(organizationId);
  }

  @Post(':organizationId/members')
  @RequirePermission('organization:members:manage')
  addMember(
    @Param('organizationId') organizationId: string,
    @Body(new ZodValidationPipe(addOrganizationMemberSchema)) dto: AddOrganizationMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organizationsService.addMember(organizationId, dto, user.id);
  }

  @Patch(':organizationId/members/:membershipId')
  @RequirePermission('organization:members:manage')
  updateMember(
    @Param('organizationId') organizationId: string,
    @Param('membershipId') membershipId: string,
    @Body(new ZodValidationPipe(updateOrganizationMemberSchema)) dto: UpdateOrganizationMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organizationsService.updateMember(organizationId, membershipId, dto, user.id);
  }

  @Delete(':organizationId/members/:membershipId')
  @RequirePermission('organization:members:manage')
  removeMember(
    @Param('organizationId') organizationId: string,
    @Param('membershipId') membershipId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organizationsService.removeMember(organizationId, membershipId, user.id);
  }
}
