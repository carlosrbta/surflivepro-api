import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service.js';
import type {
  AddOrganizationMemberDto,
  UpdateOrganizationMemberDto,
} from './dto/add-member.schema.js';
import type { CreateOrganizationDto } from './dto/create-organization.schema.js';
import type { UpdateOrganizationDto } from './dto/update-organization.schema.js';
import { OrganizationMembership } from './entities/organization-membership.entity.js';
import { Organization } from './entities/organization.entity.js';
import { OrganizationPolicy } from './organization.policy.js';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizations: Repository<Organization>,
    @InjectRepository(OrganizationMembership)
    private readonly memberships: Repository<OrganizationMembership>,
    private readonly organizationPolicy: OrganizationPolicy,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateOrganizationDto, creatorUserId: string): Promise<Organization> {
    const organization = await this.organizations.save(
      this.organizations.create({ name: dto.name }),
    );

    await this.memberships.save(
      this.memberships.create({
        organizationId: organization.id,
        userId: creatorUserId,
        role: 'ORGANIZER',
        status: 'active',
      }),
    );

    await this.auditService.record({
      actorUserId: creatorUserId,
      action: 'organization_member_added',
      resource: 'organization',
      resourceId: organization.id,
      organizationId: organization.id,
      result: 'SUCCESS',
    });

    return organization;
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.organizations.findOne({ where: { id } });
    if (!organization) throw new NotFoundException('Organization not found.');
    return organization;
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.findOne(id);
    Object.assign(organization, dto);
    return this.organizations.save(organization);
  }

  async listMembers(organizationId: string): Promise<OrganizationMembership[]> {
    return this.memberships.find({ where: { organizationId } });
  }

  async addMember(
    organizationId: string,
    dto: AddOrganizationMemberDto,
    actorUserId: string,
  ): Promise<OrganizationMembership> {
    await this.findOne(organizationId);

    const membership = await this.memberships.save(
      this.memberships.create({
        organizationId,
        userId: dto.userId,
        role: dto.role,
        status: 'active',
      }),
    );

    await this.auditService.record({
      actorUserId,
      action: 'organization_member_added',
      resource: 'organization_membership',
      resourceId: membership.id,
      organizationId,
      result: 'SUCCESS',
    });

    return membership;
  }

  async updateMember(
    organizationId: string,
    membershipId: string,
    dto: UpdateOrganizationMemberDto,
    actorUserId: string,
  ): Promise<OrganizationMembership> {
    const membership = await this.memberships.findOne({
      where: { id: membershipId, organizationId },
    });
    if (!membership) throw new NotFoundException('Membership not found.');

    const demotingOrDeactivating =
      (dto.role !== undefined && dto.role !== membership.role) ||
      (dto.status !== undefined && dto.status !== membership.status);

    if (demotingOrDeactivating) {
      await this.organizationPolicy.assertCanRemoveOrDemote(organizationId, membershipId);
    }

    const roleChanged = dto.role !== undefined && dto.role !== membership.role;
    Object.assign(membership, dto);
    const saved = await this.memberships.save(membership);

    await this.auditService.record({
      actorUserId,
      action: roleChanged ? 'organization_role_changed' : 'organization_member_added',
      resource: 'organization_membership',
      resourceId: saved.id,
      organizationId,
      result: 'SUCCESS',
    });

    return saved;
  }

  async removeMember(
    organizationId: string,
    membershipId: string,
    actorUserId: string,
  ): Promise<void> {
    await this.organizationPolicy.assertCanRemoveOrDemote(organizationId, membershipId);

    const result = await this.memberships.delete({ id: membershipId, organizationId });
    if (result.affected === 0) throw new NotFoundException('Membership not found.');

    await this.auditService.record({
      actorUserId,
      action: 'organization_member_removed',
      resource: 'organization_membership',
      resourceId: membershipId,
      organizationId,
      result: 'SUCCESS',
    });
  }
}
