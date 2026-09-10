import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import type { AuthUser } from '../../auth/auth-user.type.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  addEventMemberSchema,
  updateEventMemberSchema,
  type AddEventMemberDto,
  type UpdateEventMemberDto,
} from './dto/add-member.schema.js';
import { createEventSchema, type CreateEventDto } from './dto/create-event.schema.js';
import { updateEventSchema, type UpdateEventDto } from './dto/update-event.schema.js';
import { EventsService } from './events.service.js';

/**
 * Nested under /organizations/:organizationId so organizationId is always
 * present for AuthorizationGuard's context resolution, and EventPolicy can
 * reject an eventId/organizationId pair that don't actually match.
 */
@Controller('organizations/:organizationId/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @RequirePermission('event:create')
  create(
    @Param('organizationId') organizationId: string,
    @Body(new ZodValidationPipe(createEventSchema)) dto: CreateEventDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventsService.create(organizationId, dto, user.id);
  }

  @Get(':eventId')
  @RequirePermission('event:read')
  findOne(@Param('organizationId') organizationId: string, @Param('eventId') eventId: string) {
    return this.eventsService.findOne(organizationId, eventId);
  }

  @Patch(':eventId')
  @RequirePermission('event:update')
  update(
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Body(new ZodValidationPipe(updateEventSchema)) dto: UpdateEventDto,
  ) {
    return this.eventsService.update(organizationId, eventId, dto);
  }

  @Get(':eventId/members')
  @RequirePermission('event:read')
  listMembers(@Param('eventId') eventId: string) {
    return this.eventsService.listMembers(eventId);
  }

  @Post(':eventId/members')
  @RequirePermission('event:manage')
  addMember(
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Body(new ZodValidationPipe(addEventMemberSchema)) dto: AddEventMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventsService.addMember(organizationId, eventId, dto, user.id);
  }

  @Patch(':eventId/members/:membershipId')
  @RequirePermission('event:manage')
  updateMember(
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Param('membershipId') membershipId: string,
    @Body(new ZodValidationPipe(updateEventMemberSchema)) dto: UpdateEventMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventsService.updateMember(organizationId, eventId, membershipId, dto, user.id);
  }

  @Delete(':eventId/members/:membershipId')
  @RequirePermission('event:manage')
  removeMember(
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Param('membershipId') membershipId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventsService.removeMember(organizationId, eventId, membershipId, user.id);
  }
}
