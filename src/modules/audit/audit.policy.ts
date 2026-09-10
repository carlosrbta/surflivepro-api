import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthUser } from '../../auth/auth-user.type.js';
import { EventMembership } from '../events/entities/event-membership.entity.js';
import { OrganizationMembership } from '../organizations/entities/organization-membership.entity.js';

export type AuditReadScope =
  | { type: 'global' }
  | { type: 'organization'; organizationId: string }
  | { type: 'event'; eventId: string }
  | { type: 'denied' };

export interface AuditReadFilter {
  organizationId?: string;
  eventId?: string;
}

/**
 * Answers "is this operation allowed in this context" for the Audit domain.
 * Read-only — never mutates state (doc §7).
 */
@Injectable()
export class AuditPolicy {
  constructor(
    @InjectRepository(OrganizationMembership)
    private readonly organizationMemberships: Repository<OrganizationMembership>,
    @InjectRepository(EventMembership)
    private readonly eventMemberships: Repository<EventMembership>,
  ) {}

  async resolveReadScope(user: AuthUser, filter: AuditReadFilter): Promise<AuditReadScope> {
    if (user.platformRole === 'PLATFORM_ADMIN') {
      return { type: 'global' };
    }

    if (filter.eventId) {
      const isHeadJudge = await this.eventMemberships.exists({
        where: { eventId: filter.eventId, userId: user.id, role: 'HEAD_JUDGE', status: 'active' },
      });
      if (isHeadJudge) {
        return { type: 'event', eventId: filter.eventId };
      }
    }

    if (filter.organizationId) {
      const isOrganizer = await this.organizationMemberships.exists({
        where: {
          organizationId: filter.organizationId,
          userId: user.id,
          role: 'ORGANIZER',
          status: 'active',
        },
      });
      if (isOrganizer) {
        return { type: 'organization', organizationId: filter.organizationId };
      }
    }

    return { type: 'denied' };
  }
}
