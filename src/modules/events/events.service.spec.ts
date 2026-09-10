import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from '../audit/audit.service.js';
import { EventMembership } from './entities/event-membership.entity.js';
import { Event } from './entities/event.entity.js';
import { EventPolicy } from './event.policy.js';
import { EventsService } from './events.service.js';

interface EventMockRepo {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
}

interface MembershipMockRepo {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  delete: jest.Mock;
}

describe('EventsService', () => {
  let service: EventsService;
  let events: EventMockRepo;
  let memberships: MembershipMockRepo;
  let eventPolicy: { assertBelongsToOrganization: jest.Mock };
  let auditService: { record: jest.Mock };

  beforeEach(async () => {
    events = {
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (entity: object) => ({ id: 'event-1', ...entity })),
      findOne: jest.fn(),
    };
    memberships = {
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (entity: object) => ({ id: 'membership-1', ...entity })),
      find: jest.fn(),
      delete: jest.fn(),
    };
    eventPolicy = { assertBelongsToOrganization: jest.fn() };
    auditService = { record: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useValue: events },
        { provide: getRepositoryToken(EventMembership), useValue: memberships },
        { provide: EventPolicy, useValue: eventPolicy },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(EventsService);
  });

  it('creates an event under the given organization', async () => {
    const event = await service.create('org-1', { name: 'Rio Pro' }, 'user-1');

    expect(event.id).toBe('event-1');
    expect(events.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-1', name: 'Rio Pro', status: 'DRAFT' }),
    );
  });

  it('rejects adding a member when the event does not belong to the organization', async () => {
    eventPolicy.assertBelongsToOrganization.mockRejectedValue(
      new NotFoundException('Event not found in this organization.'),
    );

    await expect(
      service.addMember(
        'org-1',
        'event-from-another-org',
        { userId: 'u1', role: 'JUDGE' },
        'actor-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(memberships.save).not.toHaveBeenCalled();
  });

  it('allows a user to hold multiple roles on the same event', async () => {
    eventPolicy.assertBelongsToOrganization.mockResolvedValue({});

    await service.addMember('org-1', 'event-1', { userId: 'u1', role: 'JUDGE' }, 'actor-1');
    await service.addMember(
      'org-1',
      'event-1',
      { userId: 'u1', role: 'PRIORITY_JUDGE' },
      'actor-1',
    );

    expect(memberships.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ userId: 'u1', role: 'JUDGE' }),
    );
    expect(memberships.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ userId: 'u1', role: 'PRIORITY_JUDGE' }),
    );
    expect(auditService.record).toHaveBeenCalledTimes(2);
  });
});
