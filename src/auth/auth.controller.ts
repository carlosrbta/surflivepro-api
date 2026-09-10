import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventMembership } from '../modules/events/entities/event-membership.entity.js';
import { OrganizationMembership } from '../modules/organizations/entities/organization-membership.entity.js';
import type { AuthUser } from './auth-user.type.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

/**
 * Better Auth's own endpoints (sign-up, sign-in, sessions, ...) are mounted
 * as raw Express middleware in main.ts, outside Nest's routing — so they
 * don't appear here. This controller is a small Nest-routed convenience
 * endpoint that doubles as an end-to-end proof the guard stack works.
 */
@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(OrganizationMembership)
    private readonly organizationMemberships: Repository<OrganizationMembership>,
    @InjectRepository(EventMembership)
    private readonly eventMemberships: Repository<EventMembership>,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    const [organizationMemberships, eventMemberships] = await Promise.all([
      this.organizationMemberships.find({ where: { userId: user.id, status: 'active' } }),
      this.eventMemberships.find({ where: { userId: user.id, status: 'active' } }),
    ]);

    return { user, organizationMemberships, eventMemberships };
  }
}
