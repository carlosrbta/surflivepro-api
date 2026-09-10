import { ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { OrganizationMembership } from './entities/organization-membership.entity.js';
import { OrganizationPolicy } from './organization.policy.js';

describe('OrganizationPolicy', () => {
  let policy: OrganizationPolicy;
  let memberships: jest.Mocked<Pick<Repository<OrganizationMembership>, 'findOne' | 'count'>>;

  beforeEach(async () => {
    memberships = { findOne: jest.fn(), count: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationPolicy,
        { provide: getRepositoryToken(OrganizationMembership), useValue: memberships },
      ],
    }).compile();

    policy = module.get(OrganizationPolicy);
  });

  it('is a no-op for a MEMBER (not an ORGANIZER, nothing to protect)', async () => {
    memberships.findOne.mockResolvedValue({
      id: 'm-1',
      role: 'MEMBER',
      status: 'active',
    } as OrganizationMembership);

    await expect(policy.assertCanRemoveOrDemote('org-1', 'm-1')).resolves.toBeUndefined();
    expect(memberships.count).not.toHaveBeenCalled();
  });

  it('allows removing an ORGANIZER when another active ORGANIZER remains', async () => {
    memberships.findOne.mockResolvedValue({
      id: 'm-1',
      role: 'ORGANIZER',
      status: 'active',
    } as OrganizationMembership);
    memberships.count.mockResolvedValue(2);

    await expect(policy.assertCanRemoveOrDemote('org-1', 'm-1')).resolves.toBeUndefined();
  });

  it('blocks removing the last active ORGANIZER of an organization', async () => {
    memberships.findOne.mockResolvedValue({
      id: 'm-1',
      role: 'ORGANIZER',
      status: 'active',
    } as OrganizationMembership);
    memberships.count.mockResolvedValue(1);

    await expect(policy.assertCanRemoveOrDemote('org-1', 'm-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
