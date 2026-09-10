import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationMembership } from './entities/organization-membership.entity.js';

/**
 * Domain invariants for Organization membership that go beyond a plain
 * permission check (doc §7: Policies encode "is this operation allowed in
 * this context", RBAC alone can't express "don't leave an org without an
 * ORGANIZER").
 */
@Injectable()
export class OrganizationPolicy {
  constructor(
    @InjectRepository(OrganizationMembership)
    private readonly memberships: Repository<OrganizationMembership>,
  ) {}

  async assertCanRemoveOrDemote(organizationId: string, membershipId: string): Promise<void> {
    const target = await this.memberships.findOne({ where: { id: membershipId, organizationId } });
    if (!target || target.role !== 'ORGANIZER' || target.status !== 'active') return;

    const activeOrganizerCount = await this.memberships.count({
      where: { organizationId, role: 'ORGANIZER', status: 'active' },
    });

    if (activeOrganizerCount <= 1) {
      throw new ConflictException(
        'An organization must always have at least one active ORGANIZER.',
      );
    }
  }
}
