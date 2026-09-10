import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity.js';

/**
 * Domain invariant: Event Roles are contextual to a single Event and it must
 * belong to the Organization the operation is scoped to (doc §8) — this is
 * enforced once, close to the domain, rather than re-derived by every caller.
 */
@Injectable()
export class EventPolicy {
  constructor(
    @InjectRepository(Event)
    private readonly events: Repository<Event>,
  ) {}

  async assertBelongsToOrganization(eventId: string, organizationId: string): Promise<Event> {
    const event = await this.events.findOne({ where: { id: eventId, organizationId } });
    if (!event) {
      throw new NotFoundException('Event not found in this organization.');
    }
    return event;
  }
}
