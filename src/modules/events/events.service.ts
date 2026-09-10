import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service.js';
import type { AddEventMemberDto, UpdateEventMemberDto } from './dto/add-member.schema.js';
import type { CreateEventDto } from './dto/create-event.schema.js';
import type { UpdateEventDto } from './dto/update-event.schema.js';
import { EventMembership } from './entities/event-membership.entity.js';
import { Event } from './entities/event.entity.js';
import { EventPolicy } from './event.policy.js';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly events: Repository<Event>,
    @InjectRepository(EventMembership)
    private readonly memberships: Repository<EventMembership>,
    private readonly eventPolicy: EventPolicy,
    private readonly auditService: AuditService,
  ) {}

  async create(organizationId: string, dto: CreateEventDto, actorUserId: string): Promise<Event> {
    const event = await this.events.save(
      this.events.create({ organizationId, name: dto.name, status: 'DRAFT' }),
    );

    await this.auditService.record({
      actorUserId,
      action: 'event_member_added',
      resource: 'event',
      resourceId: event.id,
      organizationId,
      eventId: event.id,
      result: 'SUCCESS',
    });

    return event;
  }

  async findOne(organizationId: string, eventId: string): Promise<Event> {
    return this.eventPolicy.assertBelongsToOrganization(eventId, organizationId);
  }

  async update(organizationId: string, eventId: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(organizationId, eventId);
    Object.assign(event, dto);
    return this.events.save(event);
  }

  async listMembers(eventId: string): Promise<EventMembership[]> {
    return this.memberships.find({ where: { eventId } });
  }

  async addMember(
    organizationId: string,
    eventId: string,
    dto: AddEventMemberDto,
    actorUserId: string,
  ): Promise<EventMembership> {
    await this.eventPolicy.assertBelongsToOrganization(eventId, organizationId);

    const membership = await this.memberships.save(
      this.memberships.create({ eventId, userId: dto.userId, role: dto.role, status: 'active' }),
    );

    await this.auditService.record({
      actorUserId,
      action: 'event_member_added',
      resource: 'event_membership',
      resourceId: membership.id,
      organizationId,
      eventId,
      result: 'SUCCESS',
    });

    return membership;
  }

  async updateMember(
    organizationId: string,
    eventId: string,
    membershipId: string,
    dto: UpdateEventMemberDto,
    actorUserId: string,
  ): Promise<EventMembership> {
    await this.eventPolicy.assertBelongsToOrganization(eventId, organizationId);

    const membership = await this.memberships.findOne({ where: { id: membershipId, eventId } });
    if (!membership) throw new NotFoundException('Membership not found.');

    Object.assign(membership, dto);
    const saved = await this.memberships.save(membership);

    await this.auditService.record({
      actorUserId,
      action: 'event_role_changed',
      resource: 'event_membership',
      resourceId: saved.id,
      organizationId,
      eventId,
      result: 'SUCCESS',
    });

    return saved;
  }

  async removeMember(
    organizationId: string,
    eventId: string,
    membershipId: string,
    actorUserId: string,
  ): Promise<void> {
    await this.eventPolicy.assertBelongsToOrganization(eventId, organizationId);

    const result = await this.memberships.delete({ id: membershipId, eventId });
    if (result.affected === 0) throw new NotFoundException('Membership not found.');

    await this.auditService.record({
      actorUserId,
      action: 'event_member_removed',
      resource: 'event_membership',
      resourceId: membershipId,
      organizationId,
      eventId,
      result: 'SUCCESS',
    });
  }
}
