import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthUser } from '../auth-user.type.js';
import { EventMembership } from '../../modules/events/entities/event-membership.entity.js';
import { Event } from '../../modules/events/entities/event.entity.js';
import { OrganizationMembership } from '../../modules/organizations/entities/organization-membership.entity.js';
import type { AuthorizationContext, Permission } from './permission.types.js';
import {
  EVENT_ROLE_PERMISSIONS,
  ORGANIZATION_ROLE_PERMISSIONS,
  PLATFORM_ADMIN_PERMISSIONS,
} from './roles.js';

/**
 * Thin authorization check: platform role, then active Organization/Event
 * memberships for the given context. No generic registry or context
 * resolver — deliberately simple (doc §7).
 */
@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(OrganizationMembership)
    private readonly organizationMemberships: Repository<OrganizationMembership>,
    @InjectRepository(EventMembership)
    private readonly eventMemberships: Repository<EventMembership>,
    @InjectRepository(Event)
    private readonly events: Repository<Event>,
  ) {}

  async can(
    user: AuthUser,
    permission: Permission,
    context: AuthorizationContext = {},
  ): Promise<boolean> {
    if (user.platformRole === 'PLATFORM_ADMIN') {
      return PLATFORM_ADMIN_PERMISSIONS.includes(permission);
    }

    let organizationId = context.organizationId;

    // An Event's owning Organization also grants access to its ORGANIZER,
    // without a separate EventMembership row (doc §5: "ORGANIZER ... Não
    // precisa de EventMembership para administrar Events da própria
    // Organization").
    if (!organizationId && context.eventId) {
      const event = await this.events.findOne({ where: { id: context.eventId } });
      organizationId = event?.organizationId;
    }

    if (organizationId) {
      const hasOrgGrant = await this.hasOrganizationGrant(user.id, organizationId, permission);
      if (hasOrgGrant) return true;
    }

    if (context.eventId) {
      const hasEventGrant = await this.hasEventGrant(user.id, context.eventId, permission);
      if (hasEventGrant) return true;
    }

    return false;
  }

  private async hasOrganizationGrant(
    userId: string,
    organizationId: string,
    permission: Permission,
  ): Promise<boolean> {
    const membership = await this.organizationMemberships.findOne({
      where: { userId, organizationId, status: 'active' },
    });

    if (!membership) return false;

    return ORGANIZATION_ROLE_PERMISSIONS[membership.role].includes(permission);
  }

  private async hasEventGrant(
    userId: string,
    eventId: string,
    permission: Permission,
  ): Promise<boolean> {
    const memberships = await this.eventMemberships.find({
      where: { userId, eventId, status: 'active' },
    });

    return memberships.some((membership) =>
      EVENT_ROLE_PERMISSIONS[membership.role].includes(permission),
    );
  }
}
