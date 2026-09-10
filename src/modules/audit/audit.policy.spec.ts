import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { AuthUser } from '../../auth/auth-user.type.js';
import { EventMembership } from '../events/entities/event-membership.entity.js';
import { OrganizationMembership } from '../organizations/entities/organization-membership.entity.js';
import { AuditPolicy } from './audit.policy.js';

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    email: 'a@b.com',
    emailVerified: true,
    name: 'A',
    platformRole: 'USER',
    ...overrides,
  };
}

describe('AuditPolicy', () => {
  let policy: AuditPolicy;
  let organizationMemberships: jest.Mocked<Pick<Repository<OrganizationMembership>, 'exists'>>;
  let eventMemberships: jest.Mocked<Pick<Repository<EventMembership>, 'exists'>>;

  beforeEach(async () => {
    organizationMemberships = { exists: jest.fn() };
    eventMemberships = { exists: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditPolicy,
        { provide: getRepositoryToken(OrganizationMembership), useValue: organizationMemberships },
        { provide: getRepositoryToken(EventMembership), useValue: eventMemberships },
      ],
    }).compile();

    policy = module.get(AuditPolicy);
  });

  it('grants PLATFORM_ADMIN a global scope without querying memberships', async () => {
    const scope = await policy.resolveReadScope(makeUser({ platformRole: 'PLATFORM_ADMIN' }), {});

    expect(scope).toEqual({ type: 'global' });
    expect(organizationMemberships.exists).not.toHaveBeenCalled();
  });

  it('grants an ORGANIZER organization-scoped access to their own organization', async () => {
    organizationMemberships.exists.mockResolvedValue(true);

    const scope = await policy.resolveReadScope(makeUser(), { organizationId: 'org-1' });

    expect(scope).toEqual({ type: 'organization', organizationId: 'org-1' });
  });

  it('grants a HEAD_JUDGE event-scoped access to their own event', async () => {
    eventMemberships.exists.mockResolvedValue(true);

    const scope = await policy.resolveReadScope(makeUser(), { eventId: 'event-1' });

    expect(scope).toEqual({ type: 'event', eventId: 'event-1' });
  });

  it('denies a plain user with no relevant membership', async () => {
    organizationMemberships.exists.mockResolvedValue(false);
    eventMemberships.exists.mockResolvedValue(false);

    const scope = await policy.resolveReadScope(makeUser(), { organizationId: 'org-1' });

    expect(scope).toEqual({ type: 'denied' });
  });

  it('denies a request with no filter and no platform role', async () => {
    const scope = await policy.resolveReadScope(makeUser(), {});

    expect(scope).toEqual({ type: 'denied' });
  });
});
