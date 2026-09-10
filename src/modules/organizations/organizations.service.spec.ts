import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from '../audit/audit.service.js';
import { OrganizationMembership } from './entities/organization-membership.entity.js';
import { Organization } from './entities/organization.entity.js';
import { OrganizationPolicy } from './organization.policy.js';
import { OrganizationsService } from './organizations.service.js';

interface OrganizationMockRepo {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
}

interface MembershipMockRepo {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  delete: jest.Mock;
  count: jest.Mock;
}

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let organizations: OrganizationMockRepo;
  let memberships: MembershipMockRepo;
  let organizationPolicy: { assertCanRemoveOrDemote: jest.Mock };
  let auditService: { record: jest.Mock };

  beforeEach(async () => {
    organizations = {
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (entity: object) => ({ id: 'org-1', ...entity })),
      findOne: jest.fn(),
    };
    memberships = {
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (entity: object) => ({ id: 'membership-1', ...entity })),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };
    organizationPolicy = { assertCanRemoveOrDemote: jest.fn() };
    auditService = { record: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: getRepositoryToken(Organization), useValue: organizations },
        { provide: getRepositoryToken(OrganizationMembership), useValue: memberships },
        { provide: OrganizationPolicy, useValue: organizationPolicy },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(OrganizationsService);
  });

  it('creates an organization and makes the creator its first ORGANIZER', async () => {
    const org = await service.create({ name: 'CRAJ Tecnologia' }, 'user-1');

    expect(org.id).toBe('org-1');
    expect(memberships.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-1', userId: 'user-1', role: 'ORGANIZER' }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'organization_member_added', actorUserId: 'user-1' }),
    );
  });

  it('checks the policy before removing a member and records the audit entry', async () => {
    memberships.delete.mockResolvedValue({ affected: 1, raw: {} });

    await service.removeMember('org-1', 'membership-1', 'actor-1');

    expect(organizationPolicy.assertCanRemoveOrDemote).toHaveBeenCalledWith(
      'org-1',
      'membership-1',
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'organization_member_removed', actorUserId: 'actor-1' }),
    );
  });
});
