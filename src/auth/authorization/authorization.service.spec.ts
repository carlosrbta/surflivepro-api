import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { AuthUser } from '../auth-user.type.js';
import { EventMembership } from '../../modules/events/entities/event-membership.entity.js';
import { Event } from '../../modules/events/entities/event.entity.js';
import { OrganizationMembership } from '../../modules/organizations/entities/organization-membership.entity.js';
import { AuthorizationService } from './authorization.service.js';

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    email: 'user@example.com',
    emailVerified: true,
    name: 'Test User',
    platformRole: 'USER',
    ...overrides,
  };
}

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let organizationMemberships: jest.Mocked<Pick<Repository<OrganizationMembership>, 'findOne'>>;
  let eventMemberships: jest.Mocked<Pick<Repository<EventMembership>, 'find'>>;
  let events: jest.Mocked<Pick<Repository<Event>, 'findOne'>>;

  beforeEach(async () => {
    organizationMemberships = { findOne: jest.fn() };
    eventMemberships = { find: jest.fn() };
    events = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        { provide: getRepositoryToken(OrganizationMembership), useValue: organizationMemberships },
        { provide: getRepositoryToken(EventMembership), useValue: eventMemberships },
        { provide: getRepositoryToken(Event), useValue: events },
      ],
    }).compile();

    service = module.get(AuthorizationService);
  });

  it('grants everything to PLATFORM_ADMIN without touching the database', async () => {
    const user = makeUser({ platformRole: 'PLATFORM_ADMIN' });

    const allowed = await service.can(user, 'organization:update', { organizationId: 'org-1' });

    expect(allowed).toBe(true);
    expect(organizationMemberships.findOne).not.toHaveBeenCalled();
  });

  it('grants organization:update to an active ORGANIZER of that organization', async () => {
    organizationMemberships.findOne.mockResolvedValue({
      role: 'ORGANIZER',
      status: 'active',
    } as OrganizationMembership);

    const allowed = await service.can(makeUser(), 'organization:update', {
      organizationId: 'org-1',
    });

    expect(allowed).toBe(true);
  });

  it('denies organization:update to a MEMBER (read-only role)', async () => {
    organizationMemberships.findOne.mockResolvedValue({
      role: 'MEMBER',
      status: 'active',
    } as OrganizationMembership);

    const allowed = await service.can(makeUser(), 'organization:update', {
      organizationId: 'org-1',
    });

    expect(allowed).toBe(false);
  });

  it('enforces organization isolation: an ORGANIZER of org A has no grant on org B', async () => {
    organizationMemberships.findOne.mockImplementation(async ({ where }) => {
      const w = where as { organizationId: string };
      if (w.organizationId === 'org-A') {
        return { role: 'ORGANIZER', status: 'active' } as OrganizationMembership;
      }
      return null;
    });

    const allowed = await service.can(makeUser(), 'organization:update', {
      organizationId: 'org-B',
    });

    expect(allowed).toBe(false);
  });

  it('treats an inactive membership as no grant', async () => {
    organizationMemberships.findOne.mockResolvedValue(null);

    const allowed = await service.can(makeUser(), 'organization:read', { organizationId: 'org-1' });

    expect(allowed).toBe(false);
  });

  it('grants event:manage to a HEAD_JUDGE via an active EventMembership', async () => {
    eventMemberships.find.mockResolvedValue([
      { role: 'HEAD_JUDGE', status: 'active' } as EventMembership,
    ]);

    const allowed = await service.can(makeUser(), 'heat:finalize', { eventId: 'event-1' });

    expect(allowed).toBe(true);
  });

  it("lets an event's owning-organization ORGANIZER manage it without an EventMembership row", async () => {
    events.findOne.mockResolvedValue({ id: 'event-1', organizationId: 'org-1' } as Event);
    organizationMemberships.findOne.mockResolvedValue({
      role: 'ORGANIZER',
      status: 'active',
    } as OrganizationMembership);
    eventMemberships.find.mockResolvedValue([]);

    const allowed = await service.can(makeUser(), 'event:manage', { eventId: 'event-1' });

    expect(allowed).toBe(true);
  });

  it('denies a JUDGE the heat:finalize permission (HEAD_JUDGE-only)', async () => {
    eventMemberships.find.mockResolvedValue([
      { role: 'JUDGE', status: 'active' } as EventMembership,
    ]);

    const allowed = await service.can(makeUser(), 'heat:finalize', { eventId: 'event-1' });

    expect(allowed).toBe(false);
  });

  it('supports a user holding multiple roles on the same event', async () => {
    eventMemberships.find.mockResolvedValue([
      { role: 'JUDGE', status: 'active' } as EventMembership,
      { role: 'PRIORITY_JUDGE', status: 'active' } as EventMembership,
    ]);

    const allowed = await service.can(makeUser(), 'priority:manage', { eventId: 'event-1' });

    expect(allowed).toBe(true);
  });
});
